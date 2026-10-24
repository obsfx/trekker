const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const HOOK_NAME = /^use[A-Z0-9]/;
const CLASS_COMPONENT_BASES = new Set(['Component', 'PureComponent']);

class AstNames {
  static fromDeclarator(node) {
    if (node?.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      return node.id.name;
    }
    return null;
  }

  static ofFunction(node) {
    if (node.id?.name) {
      return node.id.name;
    }
    const { parent } = node;
    if (parent.type === 'CallExpression') {
      return AstNames.fromDeclarator(parent.parent);
    }
    return AstNames.fromDeclarator(parent);
  }

  static isClassComponent(node) {
    const base = node.superClass;
    if (!base) {
      return false;
    }
    if (base.type === 'Identifier') {
      return CLASS_COMPONENT_BASES.has(base.name);
    }
    return base.type === 'MemberExpression' && CLASS_COMPONENT_BASES.has(base.property.name);
  }

  static declared(node) {
    if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      if (node.id) {
        return [node.id];
      }
      return [];
    }
    if (node.type === 'VariableDeclaration') {
      return node.declarations.flatMap((declarator) => {
        if (declarator.id.type === 'Identifier') {
          return [declarator.id];
        }
        return [];
      });
    }
    return [];
  }

  static ofMember(member) {
    if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') {
      return null;
    }
    if (member.key.type === 'Identifier') {
      return member.key.name;
    }
    if (member.key.type === 'PrivateIdentifier') {
      return `#${member.key.name}`;
    }
    return null;
  }

  static declarationOf(statement) {
    if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
      return statement.declaration;
    }
    return statement;
  }
}

const oneComponentPerFile = {
  meta: {
    type: 'problem',
    docs: { description: 'Allow at most one React component definition per file' },
    messages: {
      multiple:
        "Component '{{name}}' must live in its own file. Only one component definition is allowed per file.",
    },
    schema: [],
  },
  create(context) {
    const components = new Map();

    const register = (node, name) => {
      if (!components.has(node)) {
        components.set(node, name);
      }
    };

    const registerRenderingAncestors = (jsxNode) => {
      for (const ancestor of context.sourceCode.getAncestors(jsxNode)) {
        if (!FUNCTION_TYPES.has(ancestor.type)) {
          continue;
        }
        const name = AstNames.ofFunction(ancestor);
        if (name && PASCAL_CASE.test(name)) {
          register(ancestor, name);
        }
      }
    };

    return {
      JSXElement: registerRenderingAncestors,
      JSXFragment: registerRenderingAncestors,
      'ClassDeclaration, ClassExpression'(node) {
        if (AstNames.isClassComponent(node)) {
          register(node, node.id?.name ?? 'anonymous');
        }
      },
      'Program:exit'() {
        const ordered = [...components].sort(([a], [b]) => {
          return a.range[0] - b.range[0];
        });
        for (const [node, name] of ordered.slice(1)) {
          context.report({ node, messageId: 'multiple', data: { name } });
        }
      },
    };
  },
};

const oneHookPerFile = {
  meta: {
    type: 'problem',
    docs: { description: 'Allow at most one custom hook definition per file' },
    messages: {
      multiple:
        "Hook '{{name}}' must live in its own file. Only one hook definition is allowed per file.",
    },
    schema: [],
  },
  create(context) {
    let hookCount = 0;

    return {
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const name = AstNames.ofFunction(node);
        if (!name || !HOOK_NAME.test(name)) {
          return;
        }
        hookCount += 1;
        if (hookCount > 1) {
          context.report({ node, messageId: 'multiple', data: { name } });
        }
      },
    };
  },
};

const distinctNames = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow functions, classes and members whose names only differ by letter case from another one in the same module or class',
    },
    messages: {
      clash:
        "'{{name}}' has the same name as '{{other}}' when letter case is ignored. Give each one a name of its own.",
    },
    schema: [],
  },
  create(context) {
    const reportClashes = (entries) => {
      const seen = new Map();
      for (const entry of entries) {
        const key = entry.name.toLowerCase();
        const first = seen.get(key);
        if (first === undefined) {
          seen.set(key, entry);
          continue;
        }
        if (first.accessor && entry.accessor && first.name === entry.name) {
          continue;
        }
        context.report({
          node: entry.node,
          messageId: 'clash',
          data: { name: entry.name, other: first.name },
        });
      }
    };

    return {
      ClassBody(node) {
        reportClashes(
          node.body.flatMap((member) => {
            const name = AstNames.ofMember(member);
            if (name === null) {
              return [];
            }
            const accessor = member.kind === 'get' || member.kind === 'set';
            return [{ name, node: member.key, accessor }];
          })
        );
      },
      'Program:exit'(program) {
        const entries = [];
        const classMembers = [];
        for (const statement of program.body) {
          const declaration = AstNames.declarationOf(statement);
          for (const id of AstNames.declared(declaration)) {
            entries.push({ name: id.name, node: id, accessor: false });
          }
          if (declaration.type === 'ClassDeclaration') {
            for (const member of declaration.body.body) {
              const name = AstNames.ofMember(member);
              if (name !== null) {
                classMembers.push({ name, node: member.key });
              }
            }
          }
        }
        reportClashes(entries);
        const topLevel = new Map(
          entries.map((entry) => {
            return [entry.name.toLowerCase(), entry];
          })
        );
        for (const member of classMembers) {
          const clash = topLevel.get(member.name.toLowerCase());
          if (clash !== undefined) {
            context.report({
              node: clash.node,
              messageId: 'clash',
              data: { name: clash.name, other: member.name },
            });
          }
        }
      },
    };
  },
};

export const trekkerPlugin = {
  meta: { name: 'trekker' },
  rules: {
    'one-component-per-file': oneComponentPerFile,
    'one-hook-per-file': oneHookPerFile,
    'distinct-names': distinctNames,
  },
};

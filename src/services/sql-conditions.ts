export type SqlValue = string | number;

export class SqlConditions {
  private readonly clauses: string[] = [];
  readonly params: SqlValue[] = [];

  add(clause: string, ...params: SqlValue[]): this {
    this.clauses.push(clause);
    this.params.push(...params);
    return this;
  }

  anyOf(column: string, values: readonly SqlValue[]): this {
    if (values.length === 0) {
      return this;
    }
    const placeholders = values
      .map(() => {
        return '?';
      })
      .join(', ');
    return this.add(`${column} IN (${placeholders})`, ...values);
  }

  copy(): SqlConditions {
    const copy = new SqlConditions();
    copy.clauses.push(...this.clauses);
    copy.params.push(...this.params);
    return copy;
  }

  toSql(): string {
    if (this.clauses.length === 0) {
      return '';
    }
    return `WHERE ${this.joined()}`;
  }

  joined(): string {
    return this.clauses.join(' AND ');
  }
}

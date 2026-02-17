let currentDbName = "trekker";
let dbExplicitlySet = false;

export function setCurrentDbName(name: string): void {
  currentDbName = name.toLowerCase();
  dbExplicitlySet = true;
}

export function getCurrentDbName(): string {
  return currentDbName;
}

export function isDbExplicitlySet(): boolean {
  return dbExplicitlySet;
}

export function resetDbContext(): void {
  currentDbName = "trekker";
  dbExplicitlySet = false;
}

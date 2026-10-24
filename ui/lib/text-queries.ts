export abstract class TextQueries {
  static normalize(text: string) {
    return text.trim().toLowerCase();
  }

  static isBlank(text: string | null) {
    return text === null || text.trim() === '';
  }

  static matches(query: string, text: string) {
    const needle = TextQueries.normalize(query);
    if (needle === '') {
      return true;
    }
    return text.toLowerCase().includes(needle);
  }
}

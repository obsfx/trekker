import plur from 'plur';

export abstract class CountLabels {
  private static readonly format = new Intl.NumberFormat('en-US');

  static of(count: number, noun: string) {
    return `${CountLabels.format.format(count)} ${plur(noun, count)}`;
  }
}

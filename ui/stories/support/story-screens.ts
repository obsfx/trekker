import { userEvent, within } from 'storybook/test';

export abstract class StoryScreens {
  static async openFromButton(canvasElement: HTMLElement, name: string) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name }));
    return { canvas, body: within(canvasElement.ownerDocument.body) };
  }

  static async startEditing(canvasElement: HTMLElement, title: string, label: string) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTitle(title));
    return { canvas, input: canvas.getByLabelText(label) };
  }
}

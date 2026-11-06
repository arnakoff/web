// What the pages that show an API answer share to build it in the DOM: text
// paragraphs, callouts cloned from the page's `<template data-callout>` and
// an RFC 9457 error. Text only goes in as text, never as HTML. Runs in the
// browser.
import { problemPage, requestId } from './checker';
import type { Problem } from './api';
import type { CalloutLevel } from './callout';

/** The no-break space before the colon of a callout title, as French typography writes it. */
const NBSP = String.fromCharCode(0xa0);

/** A link of a paragraph. */
export interface Link {
  href: string;
  label: string;
}

/** A paragraph of text and links. */
export function paragraph(...parts: (string | Link)[]): HTMLParagraphElement {
  const p = document.createElement('p');
  for (const part of parts) {
    if (typeof part === 'string') {
      p.append(part);
    } else {
      const a = document.createElement('a');
      a.href = part.href;
      a.textContent = part.label;
      p.append(a);
    }
  }
  return p;
}

/** A copy of the element of the page's template that `selector` finds. */
export function clone(selector: string): Element {
  const node = document
    .querySelector<HTMLTemplateElement>(selector)
    ?.content.firstElementChild?.cloneNode(true);
  if (!(node instanceof Element)) throw new Error(`No template ${selector}.`);
  return node;
}

/** A Callout of `level` cloned from the page's templates, with `children` as its body. */
export function callout(level: CalloutLevel, title: string | undefined, children: Node[]): Element {
  const node = clone(`template[data-callout="${level}"]`);
  if (title) node.querySelector('.label')?.append(`${NBSP}: ${title}`);
  node.querySelector('.body')?.append(...children);
  return node;
}

/** An error of the API: its detail, its request identifier and its page on the site. */
export function problemNodes(problem: Problem, ...more: Node[]): Node[] {
  const body: Node[] = [paragraph(problem.detail), ...more];
  const id = requestId(problem);
  if (id)
    body.push(paragraph(`Identifiant de la requête, à citer si tu signales un problème : ${id}`));
  const href = problemPage(problem);
  if (href) body.push(paragraph({ href, label: 'Comprendre cette erreur' }));
  return [callout('attention', problem.title, body)];
}

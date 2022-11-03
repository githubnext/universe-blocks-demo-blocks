import { tw } from "twind";
import "./style.css";
import React from "react";
import { FileBlockProps } from "@githubnext/blocks";

import {
  highlightActiveLine,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  rectangularSelection,
  highlightActiveLineGutter,
  lineNumbers,
} from "@codemirror/view";
import { EditorState, Compartment, Transaction } from "@codemirror/state";
import { indentOnInput } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  LanguageDescription,
  foldGutter,
  foldKeymap,
  bracketMatching,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import interact from "@replit/codemirror-interact";
import { vim } from "@replit/codemirror-vim";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { theme } from "./theme";

const languageCompartment = new Compartment();
const isEditableCompartment = new Compartment();
const vimModeCompartment = new Compartment();

const extensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  theme,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  indentationMarkers(),
  interact({
    rules: [
      // dragging numbers
      {
        regexp: /-?\b\d+\.?\d*\b/g,
        cursor: "ew-resize",
        onDrag: (text, setText, e) => {
          const newVal = Number(text) + e.movementX;
          if (isNaN(newVal)) return;
          setText(newVal.toString());
        },
      },
    ],
  }),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),

  languageCompartment.of([]),
  isEditableCompartment.of([]),
];

export default function ({ content, languageName, isEditable, onUpdateContent }: {
  content: string;
  languageName: string;
  isEditable: boolean;
  onUpdateContent: (content: string) => void;
}) {

  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView>();
  const [isUsingVim, setIsUsingVim] = React.useState(false);

  React.useEffect(() => {
    if (viewRef.current || !editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        vimModeCompartment.of(isUsingVim ? vim() : []),
        extensions,
        EditorView.updateListener.of((v) => {
          if (
            !v.docChanged ||
            v.transactions.every((t) => t.annotation(Transaction.remote))
          )
            return;
          onUpdateContent(v.state.doc.sliceString(0));
        }),
      ],
    });
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
  }, []);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    const doc = view.state.doc.sliceString(0);
    if (doc !== content) {
      view.dispatch({
        changes: { from: 0, to: doc.length, insert: content },
        // mark the transaction remote so we don't call `onUpdateContent` for it below
        annotations: Transaction.remote.of(true),
      });
    }
  }, [content]);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    const languageDescription = languages.find((l) => l.name === languageName)
    if (!languageDescription) return

    if (languageDescription) {
      languageDescription.load().then((lang) => {
        view.dispatch({
          effects: languageCompartment.reconfigure(lang),
        });
      });
    }
  }, [languageName]);

  React.useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;

    view.dispatch({
      effects: isEditableCompartment.reconfigure(
        EditorView.editable.of(isEditable)
      ),
    });
  }, [isEditable]);

  return (
    <div className={tw("relative w-full h-full")}>
      <div
        className={tw(`relative w-full h-full overflow-auto`)}
        ref={editorRef}
      />
    </div>
  );
}

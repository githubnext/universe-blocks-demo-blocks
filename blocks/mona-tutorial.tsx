import { FileBlockProps } from "@githubnext/blocks";
import { Button, TextInput } from "@primer/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Scrollama, Step } from 'react-scrollama';
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import Sandbox from "./mona"
import { tw } from "twind";
import { parse } from "comment-parser";
import Editor from "./code"
import { ErrorBoundary } from "./ErrorBoundary";
import "./github-markdown.css"

export default function (props: FileBlockProps) {
  const { content, context, onRequestGitHubData } = props;
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  const sections = useMemo(() => {
    return content.split("---").map((section) => {
      const codeBlockRegex = /```(.*?)\n([\s\S]*?)\n```/g;
      const codeBlocks = section.match(codeBlockRegex);
      const code = codeBlocks?.pop()?.replace(codeBlockRegex, "$2") || ""
      return {
        content: section.replace(codeBlockRegex, ""),
        code,
      }
    })
  }, [content])

  const code = sections[activeSectionIndex]?.code || "";

  return (
    <div className={tw("flex w-full h-full overflow-hidden")}>
      <div className={tw("flex-[1.2] h-full overflow-auto pb-60")}>
        <Steps sections={sections} activeSectionIndex={activeSectionIndex} setActiveSectionIndex={setActiveSectionIndex} />
      </div>
      <div className={tw("flex-1 h-full overflow-auto shadow bg-gray-50")}>
        {isLoading ? (
          <p className={tw("flex w-full h-[60%] items-center justify-center text-center text-gray-500 italic py-20")}>
            Loading...
          </p>
        ) : (
          <div className={tw("mt-[6em]")}>
            <ErrorBoundary errorKey="code">
              <Sandbox {...props} content={code} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

const Steps = ({ sections, activeSectionIndex, setActiveSectionIndex }: {
  sections: any[],
  activeSectionIndex: number,
  setActiveSectionIndex: (section: number) => void
}) => {
  return (
    <Scrollama
      offset={0.3}
      onStepEnter={({ data }) => {
        setActiveSectionIndex(data.index)
      }}>
      {sections.map((section, index) => (
        <Step data={{ ...section, index }} key={index}>
          <div className={tw("px-6 py-10 mb-20 mb-[80vh]") + " markdown-body"}>
            <ReactMarkdown rehypePlugins={[rehypeHighlight, rehypeRaw]}>
              {section.content}
            </ReactMarkdown>
          </div>
        </Step>
      ))}
    </Scrollama>
  )
}
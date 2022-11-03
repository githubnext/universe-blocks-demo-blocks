import { FileBlockProps, getLanguageFromFilename } from "@githubnext/blocks";
import { Button, Box, Text } from "@primer/react";
import { useEffect, useState } from "react";
import { PlayIcon } from "@primer/octicons-react";
import "./mona.css"
import Code from "./code"

export default function (props: FileBlockProps) {
  return <Wrapper {...props} />;
}
function Wrapper({ content, context, onRequestGitHubData }: FileBlockProps) {
  const [workingContent, setWorkingContent] = useState(content);

  const onLoadLib = async () => {
    const path = "src/index.js"
    const libCode = await onRequestGitHubData(
      `/repos/${context.owner}/${context.repo}/contents/${path}`
    )
    const unencodedContent = atob(libCode.content)
    const libWithoutExport = unencodedContent.replace(/module.exports = [^\n]+/, "")
    const libWithGlobalBinding = libWithoutExport + `
    window.onAddMona = onAddMona`
    eval(libWithGlobalBinding)
  }
  useEffect(() => {
    onLoadLib()
  }, [])

  const onRunCode = () => {
    const contentWithoutRequire = workingContent.replace(/const [^\n]+ = require\([^\n]+\)/, "")
    eval(contentWithoutRequire)
  }

  return (
    <Box>
      <Button
        sx={{
          position: "fixed",
          top: "2em",
          right: "2em",
          display: "flex",
          alignItems: "center",
          zIndex: 1000,
        }}
        variant="primary"
        onClick={onRunCode}
      >
        <PlayIcon size={16} />
        <Text ml={2}>
          Add a Mona!
        </Text>
      </Button>
      <Code
        content={workingContent}
        languageName="JavaScript"
        isEditable
        onUpdateContent={setWorkingContent}
      />
    </Box>
  );
}
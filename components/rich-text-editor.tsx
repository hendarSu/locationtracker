"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ImageIcon,
  LinkIcon,
  Heading1,
  Heading2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Enter content here...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      // Only set innerHTML if we haven't initialized yet or if value has changed externally
      if (!isInitialized || editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ""
        setIsInitialized(true)
      }
    }
  }, [value, isInitialized])

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  // Format commands
  const formatDoc = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    handleContentChange()
    editorRef.current?.focus()
  }

  // Insert image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target?.result) {
        const img = document.createElement("img")
        img.src = event.target.result as string
        img.className = "max-w-full h-auto my-2 rounded"
        img.style.maxHeight = "300px"

        // Insert image at cursor position
        document.execCommand("insertHTML", false, img.outerHTML)
        handleContentChange()
      }
    }

    reader.readAsDataURL(file)
    e.target.value = "" // Reset file input
  }

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter URL:", "https://")
    if (url) {
      formatDoc("createLink", url)
    }
  }

  // Handle placeholder text
  const handleFocus = () => {
    setIsFocused(true)
    if (editorRef.current && editorRef.current.innerHTML === placeholder) {
      editorRef.current.innerHTML = ""
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (editorRef.current && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = placeholder
    }
  }

  return (
    <div className={cn("border rounded-md flex flex-col", className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Button type="button" variant="ghost" size="sm" onClick={() => formatDoc("bold")} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatDoc("italic")} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatDoc("underline")} className="h-8 w-8 p-0">
          <Underline className="h-4 w-4" />
          <span className="sr-only">Underline</span>
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("formatBlock", "<h1>")}
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
          <span className="sr-only">Heading 1</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("formatBlock", "<h2>")}
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
          <span className="sr-only">Heading 2</span>
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("justifyLeft")}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
          <span className="sr-only">Align Left</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("justifyCenter")}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
          <span className="sr-only">Align Center</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("justifyRight")}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
          <span className="sr-only">Align Right</span>
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("insertUnorderedList")}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
          <span className="sr-only">Bullet List</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc("insertOrderedList")}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
          <span className="sr-only">Numbered List</span>
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="sr-only">Insert Image</span>
        </Button>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
        <Button type="button" variant="ghost" size="sm" onClick={insertLink} className="h-8 w-8 p-0">
          <LinkIcon className="h-4 w-4" />
          <span className="sr-only">Insert Link</span>
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "flex-1 p-3 min-h-[200px] focus:outline-none",
          isFocused ? "ring-2 ring-ring ring-offset-1" : "",
          !value && !isFocused && "text-muted-foreground",
        )}
        onInput={handleContentChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  )
}

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  sectionName: string;
}

export default function RichTextEditor({ content, onSave, sectionName }: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
    ],
    content: content,
    editable: isEditing,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[100px] p-4',
      },
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    editor?.setEditable(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    editor?.setEditable(false);
    editor?.commands.setContent(content);
  };

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const html = editor.getHTML();
      await onSave(html);
      setIsEditing(false);
      editor.setEditable(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      {isEditing && (
        <div className="sticky top-0 z-10 bg-white border border-gray-300 rounded-t-lg p-2 flex flex-wrap gap-2 shadow-sm">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('underline') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            <u>U</u>
          </button>
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            P
          </button>
          
          <div className="w-px bg-gray-300 mx-1"></div>
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            type="button"
          >
            1. List
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className={`${isEditing ? 'border border-t-0 border-gray-300 rounded-b-lg' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            type="button"
          >
            Edit {sectionName}
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

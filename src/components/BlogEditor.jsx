import { useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonUnderline,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
   RichTextEditorRef,
  MenuButtonOrderedList,
  MenuButtonBulletedList,
  MenuButtonBlockquote,
  MenuButtonCodeBlock,
  MenuButtonTextColor,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonImageUpload,
  MenuButtonLink,
  MenuButtonTable,
  MenuButtonTableDelete,
  MenuButtonTableAddRowAfter,
  MenuButtonTableAddColumnAfter,
  MenuButtonTableDeleteRow,
  MenuButtonTableDeleteColumn,
} from "mui-tiptap";

const BlogEditor = ({ content, onChange }) => {
  const rteRef = useRef<RichTextEditorRef>(null);

  const handleImageUpload = async (files) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `blog-images/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return [];
    }
  };

  return (
    <RichTextEditor
      ref={rteRef}
      extensions={[
        StarterKit,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-500 hover:text-blue-700 underline',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg max-w-full',
          },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse table-auto w-full',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
      ]}
      content={content}
      onUpdate={({ editor }) => {
        onChange(editor.getHTML());
      }}
      renderControls={() => (
        <MenuControlsContainer>
          <MenuSelectHeading />
          <MenuDivider />
          <MenuButtonBold />
          <MenuButtonItalic />
          <MenuButtonUnderline />
          <MenuDivider />
          <MenuButtonLink />
          <MenuButtonTextColor />
          <MenuButtonHighlightColor />
          <MenuDivider />
          <MenuButtonBulletedList />
          <MenuButtonOrderedList />
          <MenuDivider />
          <MenuButtonBlockquote />
          <MenuButtonCodeBlock />
          <MenuButtonHorizontalRule />
          <MenuDivider />
          <MenuButtonImageUpload onUploadFiles={handleImageUpload} />
          <MenuDivider />
          <MenuButtonTable />
          <MenuButtonTableDelete />
          <MenuButtonTableAddRowAfter />
          <MenuButtonTableAddColumnAfter />
          <MenuButtonTableDeleteRow />
          <MenuButtonTableDeleteColumn />
        </MenuControlsContainer>
      )}
      className="min-h-[400px] border rounded-lg"
    />
  );
};

export default BlogEditor; 
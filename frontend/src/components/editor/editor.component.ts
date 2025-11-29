
import { Component, ChangeDetectionStrategy, input, output, AfterViewInit, OnChanges, SimpleChanges, ElementRef, viewChild, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';

declare var Prism: any;

@Component({
  selector: 'app-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  code = input.required<string>();
  title = input.required<string>();
  language = input.required<'html' | 'css' | 'js'>();
  isReadOnly = input<boolean>(false);

  codeChange = output<string>();
  undo = output<void>();
  redo = output<void>();

  editorTextarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('editorTextarea');
  editorPre = viewChild.required<ElementRef<HTMLElement>>('editorPre');
  editorCode = viewChild.required<ElementRef<HTMLElement>>('editorCode');

  // Common state used in many components (keeps consistency)
  isLoading = signal(false);
  private destroyed = new Subject<void>();

  ngAfterViewInit(): void {
    this.editorTextarea().nativeElement.value = this.code();
    this.updateHighlight(this.code());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code']) {
      const textarea = this.editorTextarea()?.nativeElement;
      // Only update if the change comes from an external source (like the auto-formatter)
      if (textarea && textarea.value !== this.code()) {
        const { selectionStart, selectionEnd } = textarea; // Preserve cursor
        textarea.value = this.code();
        this.updateHighlight(this.code());
        // Restore cursor position after programmatic change
        if (document.activeElement === textarea) {
            textarea.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }

    if (changes['language'] && !changes['code']) {
        // If only language changes, re-highlight the existing code.
        this.updateHighlight(this.code());
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isReadOnly()) return;

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const isCtrlCmd = isMac ? event.metaKey : event.ctrlKey;

    // Shortcut: Undo (Ctrl/Cmd + Z)
    if (isCtrlCmd && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        this.undo.emit();
        return;
    }

    // Shortcut: Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
    if (
        (isCtrlCmd && event.key.toLowerCase() === 'y') ||
        (isCtrlCmd && event.shiftKey && event.key.toLowerCase() === 'z')
    ) {
        event.preventDefault();
        this.redo.emit();
        return;
    }

    // Shortcut: Toggle Comment (Ctrl/Cmd + /)
    if (isCtrlCmd && event.key === '/') {
        event.preventDefault();
        this.toggleComment();
        return;
    }

    // Shortcut: Indent/Un-indent (Tab / Shift+Tab)
    if (event.key === 'Tab') {
        event.preventDefault();
        this.handleTab(event.shiftKey);
        return;
    }

    const textarea = this.editorTextarea().nativeElement;
    const { value, selectionStart, selectionEnd } = textarea;

    // Handle Enter key for auto-indent
    if (event.key === 'Enter') {
      event.preventDefault();

      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);
      const indentMatch = currentLine.match(/^\s*/);
      let indent = indentMatch ? indentMatch[0] : '';

      // Increase indent if line ends with an opening brace
      if (currentLine.trim().endsWith('{')) {
        indent += '  '; // Using 2 spaces for indentation
      }

      const textToInsert = '\n' + indent;
      
      const newCode = value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd);
      textarea.value = newCode;
      
      const newCursorPos = selectionStart + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);

      this.handleCodeChange(newCode);
      return;
    }

    // Handle closing brace for auto-unindent
    if (event.key === '}') {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);

      // If the line is just whitespace before the brace and we can un-indent
      if (currentLine.trim() === '' && currentLine.length >= 2) {
        event.preventDefault();
        
        const unindentedLine = currentLine.substring(0, currentLine.length - 2);
        const newCode = value.substring(0, lineStart) + unindentedLine + '}' + value.substring(selectionEnd);
        textarea.value = newCode;

        const newCursorPos = lineStart + unindentedLine.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        this.handleCodeChange(newCode);
        return;
      }
    }
  }

  onCodeInput(event: Event): void {
    if (this.isReadOnly()) {
      return;
    }

    const currentCode = (event.target as HTMLTextAreaElement).value;
    this.handleCodeChange(currentCode);
  }

  private handleCodeChange(code: string): void {
    this.updateHighlight(code);
    this.codeChange.emit(code);
  }

  private updateHighlight(code: string): void {
    const codeEl = this.editorCode()?.nativeElement;
    if (!codeEl) return;

    // Always set the raw text content first. This serves as the fallback.
    codeEl.textContent = code;

    // Check if Prism and its highlight method are available before proceeding.
    if (typeof Prism !== 'undefined' && typeof Prism.highlightElement !== 'undefined') {
      try {
        // Trigger Prism to highlight the element.
        // The line-numbers plugin will be activated automatically.
        Prism.highlightElement(codeEl);
      } catch (e) {
        console.error('Prism.js highlighting failed:', e);
        // If highlighting fails, the raw text is already in place.
      }
    }
  }

  syncScroll(): void {
    const textarea = this.editorTextarea().nativeElement;
    const pre = this.editorPre().nativeElement;
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  }

  private handleTab(isShiftPressed: boolean): void {
    const textarea = this.editorTextarea().nativeElement;
    const { value, selectionStart, selectionEnd } = textarea;
    const indent = '  ';

    // If multiple lines are selected, apply multi-line indent/un-indent
    if (selectionStart !== selectionEnd && value.substring(selectionStart, selectionEnd).includes('\n')) {
        const lineStartIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
        // Find end of the line where selection ends
        const tempLineEndIndex = value.indexOf('\n', selectionEnd - 1);
        const lineEndIndex = tempLineEndIndex === -1 ? value.length : tempLineEndIndex;
        
        const selectedBlock = value.substring(lineStartIndex, lineEndIndex);
        const lines = selectedBlock.split('\n');
        
        const modifiedBlock = lines.map(line => {
            if (isShiftPressed) {
                if (line.startsWith(indent)) {
                    return line.substring(indent.length);
                }
            } else {
                if (line.trim() !== '') {
                    return indent + line;
                }
            }
            return line;
        }).join('\n');

        const newCode = value.substring(0, lineStartIndex) + modifiedBlock + value.substring(lineEndIndex);
        textarea.value = newCode;
        textarea.setSelectionRange(lineStartIndex, lineStartIndex + modifiedBlock.length);
        this.handleCodeChange(newCode);

    } else { // Single line or no selection
        if (isShiftPressed) {
            // Not handled for single line, could be added later
        } else {
            const newCode = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
            textarea.value = newCode;
            textarea.setSelectionRange(selectionStart + indent.length, selectionStart + indent.length);
            this.handleCodeChange(newCode);
        }
    }
  }

  private toggleComment(): void {
    const textarea = this.editorTextarea().nativeElement;
    const { value, selectionStart, selectionEnd } = textarea;
    const lang = this.language();

    // Use line comments for JS
    if (lang === 'js') {
        const lineStartIndex = value.lastIndexOf('\n', selectionStart - 1) + 1;
        // Find end of last selected line, catering for selections ending on a newline
        const tempLineEndIndex = value.indexOf('\n', selectionEnd > lineStartIndex ? selectionEnd - 1 : selectionEnd);
        const lineEndIndex = tempLineEndIndex === -1 ? value.length : tempLineEndIndex;
        
        const selectedBlock = value.substring(lineStartIndex, lineEndIndex);
        const lines = selectedBlock.split('\n');
        const marker = '// ';

        // Check if all non-empty lines are already commented
        const allCommented = lines.filter(l => l.trim() !== '').every(line => line.trim().startsWith(marker));
        
        const modifiedBlock = lines.map(line => {
            if (line.trim() === '') return line;
            return allCommented ? line.replace(marker, '') : marker + line;
        }).join('\n');
        
        const newCode = value.substring(0, lineStartIndex) + modifiedBlock + value.substring(lineEndIndex);
        textarea.value = newCode;
        textarea.setSelectionRange(lineStartIndex, lineStartIndex + modifiedBlock.length);
        this.handleCodeChange(newCode);
        return;
    }

    // Use block comments for HTML & CSS
    const blockMarkers = {
        html: { start: '<!-- ', end: ' -->' },
        css: { start: '/* ', end: ' */' },
    }[lang];

    if (!blockMarkers) return;

    const selectedText = value.substring(selectionStart, selectionEnd);
    
    // Check if the exact selection is already wrapped
    if (selectedText.startsWith(blockMarkers.start) && selectedText.endsWith(blockMarkers.end)) {
        // Uncomment
        const newText = selectedText.substring(blockMarkers.start.length, selectedText.length - blockMarkers.end.length);
        const newCode = value.substring(0, selectionStart) + newText + value.substring(selectionEnd);
        textarea.value = newCode;
        textarea.setSelectionRange(selectionStart, selectionEnd - blockMarkers.start.length - blockMarkers.end.length);
        this.handleCodeChange(newCode);
    } else {
        // Comment
        const newText = `${blockMarkers.start}${selectedText}${blockMarkers.end}`;
        const newCode = value.substring(0, selectionStart) + newText + value.substring(selectionEnd);
        textarea.value = newCode;
        textarea.setSelectionRange(selectionStart, selectionEnd + blockMarkers.start.length + blockMarkers.end.length);
        this.handleCodeChange(newCode);
    }
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}

declare module 'pdf-lib' {
  export class PDFDocument {
    static create(): Promise<PDFDocument>;
    static load(bytes: ArrayBuffer | Uint8Array, options?: { 
      updateMetadata?: boolean;
      ignoreEncryption?: boolean;
    }): Promise<PDFDocument>;
    
    getTitle(): string | undefined;
    getAuthor(): string | undefined;
    getSubject(): string | undefined;
    getKeywords(): string[] | undefined;
    getCreator(): string | undefined;
    getProducer(): string | undefined;
    getCreationDate(): Date | undefined;
    getModificationDate(): Date | undefined;
    getPageCount(): number;
  }
} 
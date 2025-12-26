declare module "pdfmake" {
  import { TDocumentDefinitions } from "pdfmake/interfaces";

  interface FontDefinition {
    normal?: string;
    bold?: string;
    italics?: string;
    bolditalics?: string;
  }

  interface FontDictionary {
    [fontName: string]: FontDefinition;
  }

  class PdfPrinter {
    constructor(fonts: FontDictionary);
    createPdfKitDocument(docDefinition: TDocumentDefinitions, options?: any): any;
  }

  export = PdfPrinter;
}

declare module "pdfmake/interfaces" {
  export interface TDocumentDefinitions {
    content: Content;
    styles?: any;
    defaultStyle?: any;
    pageMargins?: [number, number, number, number];
    [key: string]: any;
  }

  export type Content = any;
}

import type { CanvasTextAlign } from "@napi-rs/canvas";

interface InspireImage {
  multiline: {
    rect: {
      xFactor: number;
      y: number;
      widthPadding: number;
      height: number;
    };
    font: string;
    textAlign: CanvasTextAlign;
    minFontSize: number;
    maxFontSize: number;
  };
  author: {
    textAlign: CanvasTextAlign;
    font: string;
    color: string;
    widthPadding: number;
    heightPadding: number;
  };
}

export const inspireImages: InspireImage[] = [
  {
    author: {
      color: "#ffffff",
      font: '78px "Scheherazade New"',
      heightPadding: 31,
      textAlign: "right",
      widthPadding: 23,
    },
    multiline: {
      font: "Scheherazade New",
      maxFontSize: 97,
      minFontSize: 66,
      rect: {
        height: 390,
        widthPadding: 97,
        xFactor: 0.5,
        y: 16,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '83px "Scheherazade New"',
      heightPadding: 42,
      textAlign: "right",
      widthPadding: 42,
    },
    multiline: {
      font: "Scheherazade New",
      maxFontSize: 100,
      minFontSize: 63,
      rect: {
        height: 283,
        widthPadding: 104,
        xFactor: 0.06,
        y: 13,
      },
      textAlign: "left",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '96px "Scheherazade New"',
      heightPadding: 51,
      textAlign: "right",
      widthPadding: 38,
    },
    multiline: {
      font: "Scheherazade New",
      maxFontSize: 122,
      minFontSize: 96,
      rect: {
        height: 640,
        widthPadding: 160,
        xFactor: 0.5,
        y: 26,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '96px "Scheherazade New"',
      heightPadding: 51,
      textAlign: "right",
      widthPadding: 38,
    },
    multiline: {
      font: "Scheherazade New",
      maxFontSize: 122,
      minFontSize: 96,
      rect: {
        height: 640,
        widthPadding: 134,
        xFactor: 0.5,
        y: 26,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '80px "Scheherazade New"',
      heightPadding: 26,
      textAlign: "right",
      widthPadding: 19,
    },
    multiline: {
      font: "Scheherazade New",
      maxFontSize: 83,
      minFontSize: 61,
      rect: {
        height: 320,
        widthPadding: 128,
        xFactor: 0.98,
        y: 13,
      },
      textAlign: "right",
    },
  },
];

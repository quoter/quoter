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
      font: '200px "regular"',
      heightPadding: 80,
      textAlign: "right",
      widthPadding: 60,
    },
    multiline: {
      font: "regular",
      maxFontSize: 250,
      minFontSize: 170,
      rect: {
        height: 1000,
        widthPadding: 250,
        xFactor: 0.5,
        y: 40,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '200px "regular"',
      heightPadding: 100,
      textAlign: "right",
      widthPadding: 100,
    },
    multiline: {
      font: "regular",
      maxFontSize: 240,
      minFontSize: 150,
      rect: {
        height: 680,
        widthPadding: 250,
        xFactor: 0.06,
        y: 30,
      },
      textAlign: "left",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '150px "regular"',
      heightPadding: 80,
      textAlign: "right",
      widthPadding: 60,
    },
    multiline: {
      font: "regular",
      maxFontSize: 190,
      minFontSize: 150,
      rect: {
        height: 1000,
        widthPadding: 250,
        xFactor: 0.5,
        y: 40,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '150px "regular"',
      heightPadding: 80,
      textAlign: "right",
      widthPadding: 60,
    },
    multiline: {
      font: "regular",
      maxFontSize: 190,
      minFontSize: 150,
      rect: {
        height: 1000,
        widthPadding: 210,
        xFactor: 0.5,
        y: 40,
      },
      textAlign: "center",
    },
  },
  {
    author: {
      color: "#ffffff",
      font: '250px "regular"',
      heightPadding: 80,
      textAlign: "right",
      widthPadding: 60,
    },
    multiline: {
      font: "regular",
      maxFontSize: 260,
      minFontSize: 190,
      rect: {
        height: 1000,
        widthPadding: 400,
        xFactor: 0.98,
        y: 40,
      },
      textAlign: "right",
    },
  },
];

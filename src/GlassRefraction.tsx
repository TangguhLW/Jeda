const lensMap =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="x"><stop stop-color="rgb(246,0,0)"/><stop offset=".09" stop-color="rgb(148,0,0)"/><stop offset=".5" stop-color="rgb(128,0,0)"/><stop offset=".91" stop-color="rgb(108,0,0)"/><stop offset="1" stop-color="rgb(10,0,0)"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop stop-color="rgb(0,246,0)"/><stop offset=".09" stop-color="rgb(0,148,0)"/><stop offset=".5" stop-color="rgb(0,128,0)"/><stop offset=".91" stop-color="rgb(0,108,0)"/><stop offset="1" stop-color="rgb(0,10,0)"/></linearGradient></defs><rect width="256" height="256" fill="url(#x)"/><rect width="256" height="256" fill="url(#y)" style="mix-blend-mode:screen"/></svg>`,
  );

export default function GlassRefraction() {
  return (
    <svg
      className="glass-filter-definitions"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        {[
          { id: "liquid-glass-button", scale: 12 },
          { id: "liquid-glass-panel", scale: 28 },
        ].map(({ id, scale }) => (
          <filter
            key={id}
            id={id}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={lensMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="lens"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="lens"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

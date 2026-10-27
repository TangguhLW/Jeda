import { useEffect, useRef } from "react";

const vertex = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0., 1.); }`;
const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform float uIOR;
uniform float uShape;
uniform float uLight;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float blob(vec2 p, vec2 c, vec2 s, float a) {
  p-=c; p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;
  return 1.-smoothstep(.15,1.,length(p/s));
}
void main() {
  vec2 uv=gl_FragCoord.xy/uResolution, d=uv-.5;
  float dist=mix(length(d),max(abs(d.x),abs(d.y)),uShape);
  if(dist>.5) { gl_FragColor=vec4(0.); return; }
  float nd=dist/.5, nz=sqrt(max(1.-nd*nd,0.));
  float clock=uTime*.55;
  vec2 wave=vec2(sin(uv.y*9.+clock),cos(uv.x*8.-clock*.8))*.025*(1.-nd);
  vec3 normal=normalize(vec3((d+wave)*2.,max(nz,.08)));
  vec3 ray=refract(vec3(0.,0.,-1.),normal,1./uIOR);
  vec2 lens=uv+ray.xy*.38/max(abs(ray.z),.1);
  lens+=vec2(noise(uv*5.+uTime*.04),noise(uv*7.-uTime*.03))*.012;
  vec2 a=lens-vec2(.35+.13*sin(clock*.7),.48+.24*cos(clock*.8));
  vec2 b=lens-vec2(.65+.12*cos(clock*.6),.48+.25*sin(clock*.65));
  vec2 c=lens-vec2(.47+.19*sin(clock*.5),.5+.22*cos(clock*.9));
  float field=.045/(dot(a,a)+.008)+.040/(dot(b,b)+.008)+.028/(dot(c,c)+.008);
  float molten=smoothstep(1.4,2.2,field);
  float contour=exp(-pow((field-1.8)*2.5,2.));
  float scene=.045+molten*.55+contour*.2;
  scene+=blob(lens,vec2(.28+.12*sin(clock),.78),vec2(.46,.075),-.55)*.45;
  float fresnel=pow(1.-nz,3.);
  float rim=exp(-pow((nd-.975)*65.,2.));
  float glint=pow(max(dot(normal,normalize(vec3(-.5,.7,.6))),0.),32.);
  float shade=scene*.63+fresnel*.20+rim*.46+glint*.55;
  vec3 color=mix(vec3(.055,.065,.085),vec3(.68,.72,.77),clamp(shade,0.,1.));
  color=mix(color,vec3(.70,.73,.77)+vec3(shade*.22),uLight*.65);
  float edge=1.-smoothstep(.5-1.5/uResolution.x,.5,dist);
  gl_FragColor=vec4(color,edge*(.68+fresnel*.25));
}`;

type Props = {
  size?: number;
  speed?: number;
  ior?: number;
  shape?: "circle" | "square";
  className?: string;
};

export default function LiquidGlassSphere({
  size = 180,
  speed = 1,
  ior = 1.45,
  shape = "circle",
  className = "",
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const options = useRef({ speed, ior, shape });
  useEffect(() => {
    options.current = { speed, ior, shape };
  }, [speed, ior, shape]);
  useEffect(() => {
    const element = canvas.current,
      container = host.current;
    if (!element || !container) return;
    const gl = element.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vert = compile(gl.VERTEX_SHADER, vertex),
      frag = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram(),
      buffer = gl.createBuffer();
    const dispose = () => {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    if (!vert || !frag || !program || !buffer) {
      dispose();
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      ["uResolution", "uTime", "uIOR", "uShape", "uLight"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const transparency = matchMedia("(prefers-reduced-transparency: reduce)");
    const contrast = matchMedia("(prefers-contrast: more)");
    let frame = 0,
      last = -100,
      visible = true,
      lost = false;
    const start = performance.now();
    const draw = (now: number) => {
      if (lost) return;
      gl.uniform2f(uniforms.uResolution, element.width, element.height);
      gl.uniform1f(
        uniforms.uTime,
        motion.matches
          ? 0
          : ((now - start) / 1000) *
              Math.max(0, Math.min(options.current.speed, 3)),
      );
      gl.uniform1f(
        uniforms.uIOR,
        Math.max(1.001, Math.min(options.current.ior, 2.4)),
      );
      gl.uniform1f(uniforms.uShape, options.current.shape === "square" ? 1 : 0);
      gl.uniform1f(
        uniforms.uLight,
        document.documentElement.dataset.theme === "dark" ? 0 : 1,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      container.classList.add("liquid-sphere-ready");
    };
    const loop = (now: number) => {
      if (now - last >= 1000 / 30) {
        draw(now);
        last = now;
      }
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      if (lost || !visible || document.hidden) return;
      draw(performance.now());
      if (!motion.matches && !transparency.matches && !contrast.matches)
        frame = requestAnimationFrame(loop);
    };
    const resize = new ResizeObserver(() => {
      const pixels = Math.max(
        1,
        Math.round(
          container.getBoundingClientRect().width *
            Math.min(devicePixelRatio || 1, 2),
        ),
      );
      element.width = pixels;
      element.height = pixels;
      gl.viewport(0, 0, pixels, pixels);
      sync();
    });
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      sync();
    });
    const theme = new MutationObserver(sync);
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      container.classList.remove("liquid-sphere-ready");
    };
    element.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    transparency.addEventListener("change", sync);
    contrast.addEventListener("change", sync);
    resize.observe(container);
    intersection.observe(container);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      theme.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      transparency.removeEventListener("change", sync);
      contrast.removeEventListener("change", sync);
      element.removeEventListener("webglcontextlost", contextLost);
      container.classList.remove("liquid-sphere-ready");
      dispose();
    };
  }, []);
  return (
    <div
      ref={host}
      className={`liquid-sphere ${className}`}
      aria-hidden="true"
      style={{
        width: size,
        aspectRatio: "1",
        borderRadius: shape === "square" ? "12%" : "50%",
      }}
    >
      <canvas ref={canvas} />
    </div>
  );
}

import{_ as L}from"./CyYys1tf.js";import{_ as S,R,r as D,A as F,i as k,h as B,B as G,a as y,S as _,l as T,V,C as z,P as j,q as E}from"./Cv3oP066.js";import{G as O}from"./DNkUmkFf.js";import{G as I}from"./I_HFt57E.js";import{D as N}from"./23Dk3rtf.js";import{m as U,r as C,p as P,c as W,b as M,w as X,F as Y,o as q,d as H}from"./B9ZuqNB7.js";const Z=`
  attribute float aScale;
  uniform vec3 uMousePos;
  varying vec3 vPosition;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 direction = modelPosition.xyz - uMousePos;
    float distance = length(direction);
    if (distance < 0.5) {
      modelPosition.xyz += normalize(direction) * (0.5 - distance) * 0.2;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    vPosition = position;
    gl_Position = projectionPosition;
    gl_PointSize = aScale * 50.0 * (1.0 / -viewPosition.z);
  }
`,$=`
  uniform vec3 uColor;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    gl_FragColor = vec4(uColor, strength);
  }
`,ie=U({__name:"particles-model",setup(J){let e=null,f=null;const h={color:"#ffffff"},x=a=>{const s=new F(16777215,1);a.add(s);const o=new k(16777215,1.5);o.position.set(5,5,5),a.add(o);const t=new N;t.setDecoderPath("draco/");const c=new I;c.setDRACOLoader(t),c.load("models/particles-model/dragon.gltf",l=>{const d=[];let n=0;l.scene.traverse(i=>{if(i instanceof B&&i.geometry){const r=i.geometry.attributes.position;if(r){n+=r.count;for(let u=0;u<r.count;u++)d.push(r.getX(u),r.getY(u),r.getZ(u))}}});const v=new Float32Array(d),g=n,w=new Float32Array(g);for(let i=0;i<g;i++)w[i]=Math.random()*.5+.5;const m=new G;m.setAttribute("position",new y(v,3)),m.setAttribute("aScale",new y(w,1));const A=new _({uniforms:{uColor:{value:new z(h.color)},uMousePos:{value:new V}},vertexShader:Z,fragmentShader:$,transparent:!0,blending:T,depthWrite:!1});e=new j(m,A),e.scale.set(2,2,2),e.position.set(0,-1,0),e.rotation.y=-Math.PI/4,a.add(e)})},p=C(),b=({scene:a,renderer:s,camera:o,controls:t})=>{x(a),s.setClearColor("#000000"),t.minDistance=1,t.maxDistance=10,f=new O({width:400}),f.addColor(h,"color").onChange(n=>{e&&e.material instanceof _&&e.material.uniforms.uColor.value.set(n)});const c=new R,l=new D,d=n=>{l.x=n.clientX/window.innerWidth*2-1,l.y=-(n.clientY/window.innerHeight)*2+1,c.setFromCamera(l,o);const v=c.ray.direction.clone(),m=o.position.clone().add(v.multiplyScalar(5));e&&e.material instanceof _&&e.material.uniforms.uMousePos.value.copy(m)};window.addEventListener("mousemove",d),p.value&&p.value.onTick(()=>{}),P(()=>{window.removeEventListener("mousemove",d),f&&f.destroy()})};return P(()=>{e&&(e.geometry.dispose(),e.material instanceof E&&e.material.dispose())}),C(null),(a,s)=>{const o=L,t=S;return q(),W(Y,null,[M(o,{class:"go-back",to:"/"},{default:X(()=>s[0]||(s[0]=[H("⭠ на главную")])),_:1}),M(t,{class:"particles-model",ref_key:"threeContainerRef",ref:p,"camera-position":[0,2,5],fov:45,far:100,"custom-animation":"",onSceneReady:b},null,512)],64)}}});export{ie as default};

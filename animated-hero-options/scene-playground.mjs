export function createScene({ THREE, H, C, root }) {
  const tau = Math.PI * 2;
  const pedestal = H.group(root);
  H.box(pedestal,[6.7,.32,4.4],C.dark,[0,.15,0],.28);
  H.box(pedestal,[6.42,.09,4.12],C.line,[0,.35,0],.2);
  H.box(pedestal,[2.55,.14,1.15],C.blue,[.35,.49,-.7],.18);
  const handset = H.phone(root,{position:[.35,2.61,-.65],scale:1.04});
  handset.group.rotation.y=-.12;
  handset.group.rotation.x=-.06;
  const helper=H.robot(root,{position:[-1.95,.43,.98],scale:.86});
  helper.group.rotation.y=.35;
  H.cylinder(root,.57,.63,.18,C.blue,[-1.95,.44,.98]);

  const tray=H.group(root,[2.12,.52,1.02]);
  H.box(tray,[1.55,.22,1.27],C.blue,[0,0,0],.16);
  H.box(tray,[1.34,.08,1.05],C.ice,[0,.16,0],.08);
  const sheets=[];
  for(let i=0;i<3;i++){
    const sheet=H.group(tray,[0,.23+i*.11,0]);
    H.box(sheet,[1.13,.065,.83],C.ice,[0,0,0],.06);
    for(let j=0;j<3;j++) H.box(sheet,[.62-j*.12,.015,.045],j===0?C.blue:C.slate,[-.04,.045,-.2+j*.15],.008);
    sheets.push(sheet);
  }
  H.tube(root,[[.25,.5,-.5],[1.25,.53,-.45],[1.7,.54,.2],[2,.54,.8]],.045,C.cyan);
  const signal=H.group(root,[2.33,1.07,-1.35]);
  H.box(signal,[1.02,.16,.68],C.ice,[0,0,0],.12);
  const bars=[];
  for(let i=0;i<7;i++) bars.push(H.box(signal,[.07,.3,.085],C.cyan,[(i-3)*.11,.22,0],.03));

  const pot=H.group(root,[-2.65,.5,-1.1]);
  H.cylinder(pot,.24,.18,.4,C.peach,[0,.15,0]);
  for(let i=0;i<4;i++){
    const leaf=H.sphere(pot,.16,C.mint,[Math.sin(i*2)*.13,.55+i*.04,Math.cos(i*2)*.13]);
    leaf.scale.set(.55,1.8,.7);
    leaf.rotation.z=Math.sin(i*2)*.6;
  }
  const bubble=H.bubble(root,{position:[-.95,4.85,-.6],scale:1.14,color:C.mint,kind:'dots'});
  bubble.group.rotation.y=.35;
  const aerial=H.bubble(root,{position:[2.15,3.8,-1],scale:.77,color:C.ice,kind:'phone'});
  aerial.group.rotation.y=.35;
  const moving=[C.mint,C.cyan,C.peach].map((color,i)=>H.bubble(root,{scale:.52,color,kind:i===1?'phone':'lines'}));
  const route=new THREE.CubicBezierCurve3(
    new THREE.Vector3(-3.05,3.35,.75),new THREE.Vector3(-2,4.6,1.4),
    new THREE.Vector3(2.8,3.05,1.6),new THREE.Vector3(2.05,1.05,1.05)
  );
  return {
    update(t,interaction){
      const a=t*tau/12;
      const pulse=interaction.reduced?0:interaction.pulse;
      handset.group.position.y=2.61+.07*Math.sin(a);
      handset.group.rotation.z=.018*Math.sin(a);
      handset.messages.children.forEach((message,i)=>{
        message.position.x=(i===1?.12:-.12)+.035*Math.sin(a*2+i);
      });
      helper.head.rotation.y=interaction.x*.15+.12*Math.sin(a);
      helper.head.rotation.z=.04*Math.sin(a*2);
      helper.group.position.y=.43+.045*Math.sin(a*2);
      H.blink(helper.eyes,a*2-.5);
      helper.arms[0].rotation.z=-.2-.15*Math.sin(a*2);
      helper.arms[1].rotation.z=.3+.65*Math.pow(Math.max(0,Math.sin(a)),4)+pulse*.8;
      bubble.group.position.y=4.85+.11*Math.sin(a);
      bubble.group.rotation.z=.05*Math.sin(a);
      bubble.group.scale.setScalar(1.14+pulse*.13);
      bubble.marks.children.forEach((dot,i)=>{dot.position.y=.02+.06*Math.sin(a*3-i*.8);});
      aerial.group.position.y=3.8+.08*Math.sin(a+.8);
      aerial.group.rotation.z=.08*Math.sin(a*2+.3);
      moving.forEach((item,i)=>{
        const p=((t/12+i/3)%1+1)%1;
        const point=route.getPoint(p);
        item.group.position.copy(point);
        const s=Math.min(1,p/.12,(1-p)/.12);
        item.group.scale.setScalar(.52*Math.sin(Math.max(0,s)*Math.PI/2));
        item.group.rotation.y=.35;
        item.group.rotation.z=.12*Math.sin(p*tau);
      });
      sheets.forEach((sheet,i)=>{sheet.position.y=.23+i*.11+.022*Math.sin(a*3-i*.4);});
      bars.forEach((bar,i)=>{
        const height=.18+.24*(.5+.5*Math.sin(a*3+i*.8));
        bar.scale.y=height/.3;
        bar.position.y=.1+height/2;
      });
    }
  };
}

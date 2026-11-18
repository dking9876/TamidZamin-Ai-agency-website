export function createScene({ THREE, H, C, root }) {
  const TAU = Math.PI * 2;
  const street = H.group(root);
  const ivory = '#f4f0e5';
  const leafGreen = '#70b99e';
  const panes = [];
  const lamps = [];
  const wheels = [];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ease = (value) => {
    const u = clamp(value);
    return u * u * (3 - 2 * u);
  };
  const interval = (value, start, end) => ease((value - start) / (end - start));

  function oval(parent, rx, rz, height, color, y) {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, rx, rz, 0, TAU, false);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 48,
      steps: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, H.material(color));
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // The lane is a little piece of street, not a second scene floor.
  oval(street, 3.19, 2.19, .16, C.slate, .025);
  oval(street, 3.10, 2.10, .055, C.ink, .185);
  oval(street, 2.25, 1.06, .085, ivory, .24);

  const laneMarks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(.15, .009, .025),
    H.material(C.slate),
    22,
  );
  const placement = new THREE.Object3D();
  for (let i = 0; i < laneMarks.count; i++) {
    const angle = i * TAU / laneMarks.count;
    placement.position.set(2.69 * Math.sin(angle), .247, 1.63 * Math.cos(angle));
    placement.rotation.y = Math.atan2(1.63 * Math.sin(angle), 2.69 * Math.cos(angle));
    placement.updateMatrix();
    laneMarks.setMatrixAt(i, placement.matrix);
  }
  laneMarks.instanceMatrix.needsUpdate = true;
  laneMarks.receiveShadow = true;
  street.add(laneMarks);

  function window(parent, x, y, width, height, house) {
    H.box(parent, [width + .09, height + .09, .065], C.ice, [x, y, .527], .035);
    const pane = H.box(parent, [width, height, .035], C.dark, [x, y, .567], .025);
    panes.push({ mesh: pane, house });
    H.box(parent, [.027, height, .025], C.ice, [x, y, .59], .008);
  }

  function plant(parent, position, scale = 1) {
    const pot = H.group(parent, position);
    pot.scale.setScalar(scale);
    H.cylinder(pot, .14, .105, .21, C.peach, [0, .105, 0]);
    H.cylinder(pot, .115, .115, .018, C.ink, [0, .214, 0]);
    H.cylinder(pot, .014, .014, .28, leafGreen, [0, .34, 0]);
    const left = H.sphere(pot, .13, leafGreen, [-.065, .38, 0]);
    left.scale.set(.55, 1.55, .65);
    left.rotation.z = .5;
    const right = H.sphere(pot, .125, C.mint, [.065, .44, .01]);
    right.scale.set(.55, 1.5, .65);
    right.rotation.z = -.5;
    return pot;
  }

  // Flat roofs, deep shutters, a terrace and a small solar water heater.
  const tallHouse = H.group(street, [-.99, .325, -.2]);
  H.box(tallHouse, [1.46, 2.53, 1], ivory, [0, 1.265, 0], .13);
  H.box(tallHouse, [1.53, .13, 1.08], C.ice, [0, 2.52, 0], .055);
  H.box(tallHouse, [.49, 1.02, .07], C.ink, [.32, .51, .533], .045);
  H.box(tallHouse, [.35, .63, .025], C.blue, [.32, .66, .58], .035);
  H.box(tallHouse, [.025, .16, .035], C.peach, [.47, .47, .603], .01);
  H.box(tallHouse, [.63, .09, .25], C.ice, [.32, .045, .58], .035);
  window(tallHouse, -.37, .68, .43, .64, 0);
  window(tallHouse, -.35, 1.86, .4, .58, 0);
  window(tallHouse, .33, 1.86, .4, .58, 0);
  for (const x of [-.61, .59]) {
    const shutter = H.box(tallHouse, [.13, .65, .075], C.blue, [x, 1.86, .56], .025);
    shutter.rotation.y = x < 0 ? -.25 : .25;
  }
  H.box(tallHouse, [1.48, .17, .08], ivory, [0, 2.65, -.49], .035);
  H.box(tallHouse, [.08, .17, .94], ivory, [-.71, 2.65, 0], .035);
  H.box(tallHouse, [.08, .17, .94], ivory, [.71, 2.65, 0], .035);
  H.box(tallHouse, [1.35, .055, .055], C.blue, [0, 2.78, .49], .022);
  for (const x of [-.61, 0, .61]) {
    H.box(tallHouse, [.035, .22, .035], C.blue, [x, 2.67, .49], .012);
  }
  plant(tallHouse, [-.44, 2.585, -.2], .76);
  H.box(tallHouse, [.52, .12, .32], C.mint, [.26, 2.64, -.14], .055);

  const lowHouse = H.group(street, [1.0, .325, -.2]);
  H.box(lowHouse, [1.42, 1.82, 1], C.mint, [0, .91, 0], .13);
  H.box(lowHouse, [1.5, .13, 1.08], ivory, [0, 1.83, 0], .055);
  H.box(lowHouse, [.42, 1.03, .065], C.ink, [-.37, .515, .533], .04);
  const shopPane = H.box(lowHouse, [.31, .75, .035], C.dark, [-.37, .61, .578], .025);
  panes.push({ mesh: shopPane, house: 1 });
  H.box(lowHouse, [.025, .17, .035], C.peach, [-.24, .47, .603], .01);
  window(lowHouse, .27, .73, .55, .59, 1);
  const canopy = H.group(lowHouse, [0, 1.35, .59]);
  canopy.rotation.x = .13;
  H.box(canopy, [1.31, .10, .47], C.blue, [0, 0, 0], .045);
  H.box(canopy, [1.31, .15, .065], C.ice, [0, -.07, .225], .03);
  H.box(lowHouse, [.72, .07, .31], ivory, [.16, .035, .59], .025);
  const sideWindow = H.box(lowHouse, [.035, .48, .43], C.dark, [.722, 1.06, -.06], .02);
  panes.push({ mesh: sideWindow, house: 1 });
  H.box(lowHouse, [.06, .027, .45], C.ice, [.746, 1.06, -.06], .01);

  const solarPanel = H.group(lowHouse, [.15, 2.06, .10]);
  solarPanel.rotation.x = .43;
  H.box(solarPanel, [.72, .055, .56], C.ink, [0, 0, 0], .025);
  H.box(solarPanel, [.63, .012, .47], C.blue, [0, .033, 0], .012);
  for (const x of [-.105, .105]) {
    H.box(solarPanel, [.012, .012, .46], C.cyan, [x, .045, 0], .004);
  }
  H.box(lowHouse, [.50, .15, .18], C.slate, [.15, 1.97, -.27], .025);
  const tank = H.cylinder(lowHouse, .155, .155, .66, ivory, [.15, 2.16, -.26]);
  tank.rotation.z = Math.PI / 2;
  plant(street, [1.81, .325, .15], .78);

  // A communal reception point, deliberately much smaller than the buildings.
  H.cylinder(street, .34, .39, .09, C.blue, [0, .37, .79]);
  H.box(street, [.42, .27, .34], C.ice, [0, .525, .79], .075);
  const reception = H.phone(street, { position: [0, 1.24, .79], scale: .32 });
  reception.group.rotation.y = .32;
  const receptionLight = H.box(street, [.23, .035, .035], C.mint, [0, .57, .969], .014);

  const van = H.group(street);
  const body = H.group(van);
  H.box(body, [.59, .26, 1.02], C.blue, [0, .34, 0], .09);
  H.box(body, [.57, .48, .63], ivory, [0, .54, -.18], .10);
  H.box(body, [.55, .30, .44], C.blue, [0, .63, .32], .085);
  H.box(body, [.43, .18, .035], C.ink, [0, .67, .551], .04);
  for (const side of [-1, 1]) {
    H.box(body, [.025, .17, .27], C.ink, [side * .284, .67, .31], .025);
    H.box(body, [.025, .065, .47], C.cyan, [side * .296, .46, -.19], .023);
    H.box(body, [.035, .025, .12], C.ink, [side * .296, .48, .20], .01);
    const headlight = H.box(body, [.13, .085, .035], C.ice, [side * .18, .36, .525], .028);
    lamps.push(headlight);
  }
  H.box(body, [.48, .065, .055], C.slate, [0, .25, .53], .025);
  H.box(body, [.025, .32, .018], C.slate, [0, .54, -.503], .008);
  H.box(body, [.44, .055, .43], C.slate, [0, .806, -.18], .025);
  H.box(body, [.34, .09, .32], C.mint, [0, .866, -.18], .04);
  for (const side of [-1, 1]) {
    for (const z of [-.30, .30]) {
      const wheel = H.group(van, [side * .297, .15, z]);
      const tire = H.cylinder(wheel, .145, .145, .095, C.navy);
      tire.rotation.z = Math.PI / 2;
      const hub = H.cylinder(wheel, .075, .075, .103, C.ice);
      hub.rotation.z = Math.PI / 2;
      H.box(wheel, [.11, .018, .10], C.blue, [0, 0, 0], .007);
      wheels.push(wheel);
    }
  }

  const inquiries = [
    { source: [-.99, 3.53, .03], offset: .08, color: C.mint, kind: 'dots' },
    { source: [1.03, 2.96, .08], offset: .58, color: C.ice, kind: 'phone' },
  ].map((spec) => ({
    ...spec,
    ...H.bubble(street, { scale: .55, color: spec.color, kind: spec.kind }),
  }));
  const reply = H.bubble(street, {
    position: [.12, 2.18, .88],
    scale: .34,
    color: C.cyan,
    kind: 'lines',
  });

  // H caches materials across options; never adjust those shared instances.
  const clay = new Map();
  street.traverse((object) => {
    if (!object.isMesh) return;
    const shared = object.material;
    if (!clay.has(shared)) {
      const material = shared.clone();
      material.roughness = .73;
      material.metalness = .015;
      clay.set(shared, material);
    }
    object.material = clay.get(shared);
  });
  for (const { mesh } of panes) {
    mesh.material = mesh.material.clone();
    mesh.material.emissive.set(C.peach);
  }
  for (const lamp of lamps) {
    lamp.material = lamp.material.clone();
    lamp.material.emissive.set(C.ice);
  }
  receptionLight.material = receptionLight.material.clone();
  receptionLight.material.emissive.set(C.mint);

  function update(t, interaction = {}) {
    const reduced = Boolean(interaction.reduced);
    const pulse = clamp(Number.isFinite(interaction.pulse) ? interaction.pulse : 0);
    const pointerX = reduced ? 0 : clamp(interaction.x || 0, -1, 1);
    const pointerY = reduced ? 0 : clamp(interaction.y || 0, -1, 1);
    // Wrapping before trig makes the endpoint identical, including every property.
    const seconds = reduced || !Number.isFinite(t) ? 0 : ((t % 12) + 12) % 12;
    const wave = seconds * TAU / 12;
    const cycle = seconds / 12;
    const motion = reduced ? 0 : 1;
    const angle = wave - .7 + .1 * Math.sin(wave);
    van.position.set(2.69 * Math.sin(angle), .25, 1.63 * Math.cos(angle));
    van.rotation.set(0, Math.atan2(2.69 * Math.cos(angle), -1.63 * Math.sin(angle)), 0);
    body.rotation.set(0, 0, motion * .012 * Math.sin(2 * wave));
    for (const wheel of wheels) wheel.rotation.x = -8 * wave;
    for (const lamp of lamps) lamp.material.emissiveIntensity = .22 + 1.15 * pulse;

    let receptionBeat = 0;
    for (let i = 0; i < inquiries.length; i++) {
      const inquiry = inquiries[i];
      const u = reduced ? .16 : (cycle + inquiry.offset) % 1;
      const travel = interval(u, .22, .68);
      const show = interval(u, 0, .12) * (1 - interval(u, .65, .79));
      const arrive = interval(u, .59, .69) * (1 - interval(u, .78, .94));
      receptionBeat += reduced ? 0 : arrive;
      const [x, y, z] = inquiry.source;
      inquiry.group.position.set(
        x * (1 - travel) + .05 * travel + pointerX * .05 * (1 - travel),
        y * (1 - travel) + 1.92 * travel + .42 * Math.sin(Math.PI * travel)
          + pointerY * .035 * (1 - travel),
        z * (1 - travel) + .90 * travel,
      );
      inquiry.group.rotation.set(
        -.035 * pointerY,
        .42 + .07 * pointerX,
        motion * (.035 + .07 * pulse) * Math.sin(wave * 2 + i * Math.PI),
      );
      inquiry.group.scale.setScalar(.55 * show * (1 - .34 * travel));
      inquiry.group.visible = show > .001;
      inquiry.marks.scale.setScalar(1 + motion * .045 * pulse * Math.sin(2 * wave));
      for (const pane of panes) {
        if (pane.house === i) {
          pane.mesh.material.emissiveIntensity = .07 + .24 * pulse + .19 * show * (1 - travel);
        }
      }
    }

    const replyShow = reduced ? .75 : clamp(receptionBeat);
    reply.group.visible = replyShow > .001;
    reply.group.scale.setScalar(.34 * replyShow);
    reply.group.position.set(.10, 2.13 + motion * .11 * replyShow, .88);
    reply.group.rotation.set(0, .42 + .04 * pointerX, motion * .045 * Math.sin(wave * 2));
    reception.group.rotation.set(0, .32 + .045 * pointerX, motion * .025 * receptionBeat * Math.sin(6 * wave));
    reception.messages.scale.setScalar(1 + motion * .035 * receptionBeat);
    receptionLight.material.emissiveIntensity = .12 + .5 * receptionBeat + .5 * pulse;
  }

  update(0);
  return { update };
}

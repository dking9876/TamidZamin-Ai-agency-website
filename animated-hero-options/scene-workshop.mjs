export function createScene({ THREE, H, C, root }) {
  const TAU = Math.PI * 2;
  const ivory = '#f5f2e9';
  const workshop = H.group(root);
  workshop.name = 'helpful-workshop';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const ease = (start, end, time) => {
    const u = clamp((time - start) / (end - start), 0, 1);
    return u * u * u * (u * (u * 6 - 15) + 10);
  };
  const gesture = (time, rise, ready, release, rest) =>
    ease(rise, ready, time) * (1 - ease(release, rest, time));

  // The broad top, inset apron and rubber-soled legs read as a real little bench.
  H.box(workshop, [5.6, .24, 2.7], ivory, [0, 1.3, 0], .12);
  H.box(workshop, [5.34, .18, 2.42], C.dark, [0, 1.11, 0], .08);
  H.box(workshop, [4.65, .12, 1.82], C.slate, [0, .42, 0], .05);
  for (const x of [-2.27, 2.27]) {
    for (const z of [-.94, .94]) {
      const leg = H.box(workshop, [.31, 1.07, .35], C.dark, [x, .645, z], .09);
      leg.rotation.z = Math.sign(x) * .055;
      H.box(workshop, [.48, .12, .5], C.ink, [x + Math.sign(x) * .025, .06, z], .055);
    }
    const fastener = H.cylinder(workshop, .055, .055, .035, C.slate, [x, 1.12, 1.225]);
    fastener.rotation.x = Math.PI / 2;
  }

  const toolbox = H.group(workshop, [-1.03, 1.42, -.45]);
  toolbox.name = 'open-fitted-toolbox';
  H.box(toolbox, [2.62, .14, 1.68], C.cyan, [0, .07, 0], .065);
  H.box(toolbox, [2.36, .09, 1.42], C.dark, [0, .16, 0], .045);
  H.box(toolbox, [2.62, .41, .12], C.cyan, [0, .275, .78], .055);
  H.box(toolbox, [2.62, .41, .12], C.cyan, [0, .275, -.78], .055);
  for (const side of [-1, 1]) {
    H.box(toolbox, [.12, .41, 1.49], C.cyan, [side * 1.25, .275, 0], .055);
    const hinge = H.cylinder(toolbox, .085, .085, .38, ivory, [side * .89, .5, -.78]);
    hinge.rotation.z = Math.PI / 2;
    const hingeBand = H.cylinder(toolbox, .09, .09, .09, C.slate, [side * .89, .5, -.78]);
    hingeBand.rotation.z = Math.PI / 2;
    H.box(toolbox, [.25, .25, .07], C.slate, [side * .91, .31, .855], .04);
    H.box(toolbox, [.12, .16, .055], ivory, [side * .91, .37, .912], .035);
  }

  const lid = H.group(toolbox, [0, .5, -.78]);
  lid.rotation.x = -.16;
  H.box(lid, [2.62, 1.87, .22], C.cyan, [0, .94, 0], .11);
  H.box(lid, [2.35, 1.61, .065], C.line, [0, .94, .132], .12);
  H.tube(lid, [
    [-.46, 1.83, -.025], [-.46, 2.04, -.025],
    [0, 2.1, -.025], [.46, 2.04, -.025], [.46, 1.83, -.025],
  ], .075, ivory);
  for (const side of [-1, 1]) {
    H.sphere(lid, .085, C.peach, [side * .46, 1.83, .035]);
    for (const y of [.23, 1.65]) {
      H.sphere(lid, .035, C.cyan, [side * 1.04, y, .18]);
    }
  }

  const wrenchSlot = H.wrench(lid, {
    position: [-.62, 1.02, .185], scale: .8, color: C.navy,
  });
  wrenchSlot.rotation.z = -.12;
  wrenchSlot.scale.z = .22;
  wrenchSlot.children[1].rotation.z = Math.PI * .75;

  const wrench = H.wrench(lid, {
    position: [-.62, 1.02, .32], scale: .7, color: ivory,
  });
  wrench.name = 'lifting-wrench';
  wrench.children[1].rotation.z = Math.PI * .75;
  H.box(wrench, [.13, .48, .035], C.cyan, [0, -.13, .105], .045);

  const screwdriverSlot = H.group(lid, [.59, 1.02, .185]);
  screwdriverSlot.rotation.z = .08;
  H.box(screwdriverSlot, [.39, .55, .045], C.navy, [0, -.34, 0], .14);
  H.box(screwdriverSlot, [.17, .9, .045], C.navy, [0, .33, 0], .065);

  const screwdriver = H.group(lid, [.59, 1.02, .32]);
  screwdriver.name = 'turning-screwdriver';
  screwdriver.scale.setScalar(.74);
  H.box(screwdriver, [.36, .62, .3], C.mint, [0, -.43, 0], .145);
  H.cylinder(screwdriver, .09, .095, .13, C.slate, [0, -.07, 0]);
  H.cylinder(screwdriver, .052, .052, .84, ivory, [0, .38, 0]);
  H.box(screwdriver, [.13, .19, .055], ivory, [0, .88, 0], .025);
  H.box(screwdriver, [.28, .09, .25], C.peach, [0, -.72, 0], .04);
  for (const x of [-.075, .075]) {
    H.box(screwdriver, [.035, .34, .025], C.dark, [x, -.43, .148], .015);
  }

  // Three seated sockets make the shallow box useful without filling it with clutter.
  for (const x of [-.61, 0, .61]) {
    H.cylinder(toolbox, .19, .19, .025, C.navy, [x, .215, .08]);
    H.cylinder(toolbox, .135, .15, .235, C.ice, [x, .335, .08]);
    const recess = new THREE.Mesh(
      new THREE.CylinderGeometry(.075, .075, .013, 6),
      H.material(C.dark),
    );
    recess.position.set(x, .456, .08);
    toolbox.add(recess);
  }

  const tray = H.group(workshop, [.53, 1.42, .78]);
  tray.name = 'two-channel-intake-tray';
  H.box(tray, [1.75, .1, 1], C.mint, [0, .05, 0], .045);
  H.box(tray, [1.49, .045, .78], C.dark, [0, .121, 0], .02);
  for (const side of [-1, 1]) {
    H.box(tray, [.11, .26, 1], C.mint, [side * .82, .18, 0], .05);
  }
  H.box(tray, [1.75, .31, .1], C.mint, [0, .205, -.45], .045);
  H.box(tray, [1.75, .19, .1], C.mint, [0, .145, .45], .045);
  H.box(tray, [1.51, .2, .055], C.mint, [0, .19, 0], .025);

  const chat = H.bubble(workshop, { color: C.mint, kind: 'dots' });
  const call = H.bubble(workshop, { color: ivory, kind: 'phone' });
  chat.group.name = 'incoming-chat';
  call.group.name = 'incoming-phone-inquiry';
  // The helper's light/dark choice is palette-based; ivory needs explicit dark marks.
  call.marks.traverse(object => {
    if (object.isMesh) object.material = H.material(C.ink);
  });

  const bot = H.robot(workshop, { position: [1.65, 1.42, -.64], scale: .88 });
  bot.group.name = 'workshop-helper';

  const phoneDock = H.group(workshop, [2.1, 1.42, .83]);
  H.box(phoneDock, [.83, .13, .62], C.dark, [0, .065, 0], .065);
  for (const side of [-1, 1]) {
    H.box(phoneDock, [.19, .17, .27], C.cyan, [side * .27, .18, 0], .07);
  }
  const handset = H.group(phoneDock, [0, .27, 0]);
  H.tube(handset, [
    [-.3, -.01, 0], [-.19, .12, 0], [0, .16, 0], [.19, .12, 0], [.3, -.01, 0],
  ], .075, ivory);
  for (const side of [-1, 1]) {
    const receiver = H.box(handset, [.19, .23, .24], ivory, [side * .3, -.015, 0], .085);
    receiver.rotation.z = side * -.3;
  }
  H.tube(phoneDock, [
    [.29, .22, -.04], [.48, .18, -.12], [.47, .08, -.35],
    [.23, .06, -.42], [.1, .07, -.25],
  ], .026, C.slate);

  // Kit materials are shared across options; this scene owns its clay finish.
  const clay = new Map();
  workshop.traverse(object => {
    if (!object.isMesh) return;
    const source = object.material;
    if (!clay.has(source)) {
      const material = source.clone();
      material.roughness = .62;
      material.metalness = .025;
      clay.set(source, material);
    }
    object.material = clay.get(source);
  });

  const placeInquiry = (inquiry, seconds, reduced, config) => {
    const travel = reduced ? 1 : ease(config.start, config.land, seconds);
    const filed = reduced ? 0 : ease(config.file, config.file + .85, seconds);
    const visible = reduced ? 1 :
      ease(config.start - .4, config.start + .1, seconds) * (1 - filed);
    inquiry.group.scale.setScalar(config.scale * visible);
    inquiry.group.position.set(
      mix(config.from[0], .53, travel),
      mix(config.from[1], config.y, travel) +
        config.arc * Math.sin(Math.PI * travel) - .36 * filed,
      mix(config.from[2], config.z, travel),
    );
    inquiry.group.rotation.set(
      -.12 * travel,
      -.08 * (1 - travel),
      config.tilt * (1 - travel),
    );
  };

  const chatRoute = {
    start: 2, land: 3.8, file: 9.55,
    from: [-.1, 3.45, 1.03], y: 1.99, z: 1.07, arc: .12, tilt: -.14, scale: .64,
  };
  const callRoute = {
    start: 4, land: 5.65, file: 10,
    from: [2.1, 1.98, .83], y: 2.08, z: .54, arc: .5, tilt: .13, scale: .6,
  };

  function update(t = 0, interaction = {}) {
    const reduced = Boolean(interaction.reduced);
    const seconds = Number.isFinite(t) ? ((t % 12) + 12) % 12 : 0;
    const phase = seconds * TAU / 12;
    const px = reduced ? 0 : clamp(interaction.x || 0, -1, 1);
    const py = reduced ? 0 : clamp(interaction.y || 0, -1, 1);
    const pulse = reduced ? 0 : clamp(interaction.pulse || 0, 0, 1);
    const wrenchLift = reduced ? 0 : gesture(seconds, .55, 1.6, 4, 5.1);
    const driverLift = reduced ? 0 : gesture(seconds, .8, 1.85, 4.3, 5.4);
    const working = reduced ? 0 : gesture(seconds, 1.65, 2.15, 3.25, 3.95);
    const acknowledge = reduced ? 0 : gesture(seconds, 5.8, 6.45, 7.95, 8.6);
    const listen = reduced ? 0 : gesture(seconds, 3.7, 4.15, 4.85, 5.3);

    wrench.position.set(
      -.62 + .1 * wrenchLift,
      1.02 + .23 * wrenchLift - .08 * working - .055 * pulse,
      .32 + .5 * wrenchLift,
    );
    wrench.rotation.set(
      -.13 * wrenchLift,
      .16 * working,
      -.12 - .24 * wrenchLift + .14 * working + .055 * pulse,
    );
    screwdriver.position.set(
      .59 - .035 * driverLift,
      1.02 + .19 * driverLift - .12 * working - .055 * pulse,
      .32 + .42 * driverLift,
    );
    screwdriver.rotation.set(
      -.08 * driverLift,
      .48 * Math.sin(TAU * ease(1.75, 3.9, seconds)) * working,
      .08 + .2 * driverLift,
    );

    placeInquiry(chat, seconds, reduced, chatRoute);
    placeInquiry(call, seconds, reduced, callRoute);

    bot.head.rotation.set(
      .045 + .075 * listen - .045 * py,
      -.1 - .16 * wrenchLift + .085 * px,
      -.025 + .04 * acknowledge,
    );
    bot.arms[0].rotation.set(0, 0, -.2 - .09 * wrenchLift);
    bot.arms[1].rotation.set(
      -.08 * acknowledge,
      0,
      .2 + acknowledge * (.98 + .12 * Math.sin(phase * 14)) + .5 * pulse,
    );
    if (reduced) {
      bot.eyes.forEach(eye => { eye.scale.y = 1; });
    } else {
      H.blink(bot.eyes, phase - TAU * 7.7 / 12);
    }
    bot.eyes.forEach(eye => { eye.scale.x = 1 + .07 * pulse; });
    handset.rotation.z = listen * .065 * Math.sin(phase * 12);
  }

  update(0);
  return { update };
}

import { C, path, line, ellipse, round, head, tool } from './paint.mjs';

// Logical 1600 × 900. Keep the caller's transform: the montage owns scaling/cropping.
const TAU = Math.PI * 2;
const P = {
  wall: '#f3e8d4',
  wallShade: '#d9cdb5',
  trim: '#fff3dd',
  sage: '#86a390',
  sageLight: '#a5bba4',
  sageDark: '#5d7c6d',
  leaf: '#537c64',
  leafDark: '#345b4b',
  leafLight: '#8fae7d',
  shirtLight: '#438eae',
  shirtShade: '#1d5a78',
  trouser: '#243c4a',
  trouserLight: '#354d59',
  skinLight: '#e6b694',
  silver: '#c7ccc3',
  stone: '#c6b99f',
};

function cycle(t) {
  return Number.isFinite(t) ? ((t % 4) + 4) % 4 : 0;
}

function beat(t, center, radius) {
  const d = Math.abs(((t - center + 6) % 4) - 2);
  return d < radius ? (1 + Math.cos(Math.PI * d / radius)) / 2 : 0;
}

function gradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function stroke(ctx, d, color, width = 2) {
  path(ctx, d, null, color, width);
}

function groundShadow(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1);
  g.addColorStop(0, 'rgba(25, 43, 36, 0.22)');
  g.addColorStop(1, 'rgba(25, 43, 36, 0)');
  ellipse(ctx, 0, 0, 1, 1, g);
  ctx.restore();
}

function leaf(ctx, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  path(ctx, 'M0 0 C-25 -14 -31 -47 -8 -77 C20 -59 26 -20 0 0Z', color);
  stroke(ctx, 'M0 -3 Q-4 -38 -8 -67', 'rgba(242, 239, 209, 0.18)', 1.4);
  ctx.restore();
}

function doorstepPlant(ctx, sway) {
  ctx.save();
  ctx.translate(857, 747);
  path(ctx, 'M-48 -3 L46 -3 L34 65 Q0 81 -36 65Z', '#b58564');
  path(ctx, 'M-41 0 L-26 60 Q-4 69 2 65 L-3 0Z', '#cda07a');
  ellipse(ctx, 0, -4, 49, 12, '#7c624c');
  ellipse(ctx, 0, -6, 40, 8, '#4e4e36');
  ctx.rotate(sway);
  stroke(ctx, 'M0 -5 C-9 -52 5 -118 -9 -194 M-3 -69 Q-40 -114 -56 -130 M-3 -91 Q44 -119 53 -160', P.leafDark, 5);
  for (const [x, y, a, s, color] of [
    [-7, -149, -0.2, 0.93, P.leaf],
    [-7, -108, -0.8, 0.88, P.leafLight],
    [-24, -98, -1.12, 0.86, P.leafDark],
    [6, -85, 0.84, 0.96, P.leaf],
    [27, -128, 0.57, 0.83, P.leafLight],
    [-1, -35, -1.03, 0.79, P.leaf],
    [5, -42, 1.16, 0.8, P.leafDark],
  ]) leaf(ctx, x, y, a, s, color);
  ctx.restore();
}

function arrivalSet(ctx, time) {
  ctx.fillStyle = gradient(ctx, 0, 120, 1600, 740, [
    [0, '#f7eedc'], [0.58, P.wall], [1, '#d6d3bd'],
  ]);
  ctx.fillRect(0, 0, 1600, 900);
  path(ctx, 'M0 0 H1600 V87 L0 146Z', '#ded6c0');
  path(ctx, 'M0 0 H1600 V55 L0 113Z', '#f9f0df');
  path(ctx, 'M0 699 L1600 670 V813 H0Z', '#95afb0');
  stroke(ctx, 'M0 697 L1600 668', '#c7d4ca', 7);
  stroke(ctx, 'M0 751 L1600 722', '#7f9c9f', 2);

  // The left window is architectural depth, deliberately quieter than the people.
  round(ctx, 178, 169, 491, 421, 3, '#d8ccb4');
  round(ctx, 187, 157, 470, 415, 2, P.trim);
  ctx.fillStyle = gradient(ctx, 202, 180, 638, 555, [
    [0, '#99b9ba'], [0.55, '#abc1b9'], [1, '#d9d4b8'],
  ]);
  ctx.fillRect(205, 176, 433, 376);
  path(ctx, 'M205 176 H291 C267 294 282 410 242 552 H205Z', '#e3e1c9');
  path(ctx, 'M638 176 H561 C576 300 562 443 605 552 H638Z', '#e8e3cc');
  stroke(ctx, 'M234 183 Q222 375 217 529 M267 185 Q242 384 242 516 M590 187 Q600 374 614 521', '#cbd2bf', 3);
  path(ctx, 'M319 552 V475 Q335 448 350 470 V552Z', '#98a99a');
  ellipse(ctx, 339, 449, 20, 38, '#7f9b85');
  line(ctx, [[420, 176], [420, 551]], P.trim, 12);
  line(ctx, [[205, 366], [638, 366]], P.trim, 11);
  path(ctx, 'M174 560 H674 V582 H174Z', '#fcf2df');
  path(ctx, 'M174 582 H674 L699 597 H196Z', '#c0b59b');

  path(ctx, 'M868 148 H1226 V809 H868Z', '#baaf97');
  path(ctx, 'M878 129 H1208 V798 H878Z', '#fbefda');
  path(ctx, 'M902 153 H1184 V788 H902Z', '#36554f');
  path(ctx, 'M922 158 H1155 V783 H922Z', '#b6b49b');
  path(ctx, 'M922 158 H1111 V783 H922Z', '#d2c8a9');
  path(ctx, 'M1111 158 L1155 182 V783 H1111Z', '#879582');
  path(ctx, 'M923 633 H1155 V784 H923Z', '#a69d81');
  path(ctx, 'M957 238 H1081 V604 H957Z', '#c2b99a');
  line(ctx, [[966, 249], [1070, 249]], '#e0d2b3', 5);
  stroke(ctx, 'M1122 305 V366 M1102 321 H1138', '#536c5c', 5);
  path(ctx, 'M1111 333 Q1094 348 1094 383 L1087 488 Q1112 504 1135 487 L1129 374 Q1130 343 1121 334Z', '#8f9b86');

  // An open, foreshortened door leaves an actual occupied interior behind it.
  path(ctx, 'M1164 166 L1201 190 V784 L1164 766Z', '#306b75');
  path(ctx, 'M1170 181 L1193 196 V752 L1170 741Z', '#467f85');
  path(ctx, 'M1175 218 L1189 225 V408 L1175 402Z', '#366b73');
  path(ctx, 'M1175 454 L1189 460 V710 L1175 703Z', '#366b73');
  round(ctx, 1169, 418, 9, 43, 3, '#b8bca7');
  line(ctx, [[1174, 432], [1154, 431]], '#e0d8bc', 6);
  ellipse(ctx, 1174, 450, 2.2, 3.3, '#5c6e67');
  path(ctx, 'M878 129 H1210 V148 H878Z', '#fff4df');
  path(ctx, 'M1208 147 L1224 158 V801 H1208Z', 'rgba(53, 65, 53, 0.10)');

  // Ground extends beyond every edge; there is no isolated plinth or diorama base.
  ctx.fillStyle = gradient(ctx, 0, 778, 0, 900, [[0, '#d7ccb5'], [1, '#bdb29b']]);
  ctx.fillRect(0, 788, 1600, 112);
  path(ctx, 'M866 785 H1208 L1250 813 H845Z', '#e6dcc5');
  path(ctx, 'M845 813 H1250 V826 H845Z', '#aaa18d');
  stroke(ctx, 'M0 852 H1600 M203 788 L122 900 M707 788 L685 900 M1459 788 L1536 900', '#b2a68e', 2);
  path(ctx, 'M953 827 H1204 L1231 854 H933Z', '#8b8b73');
  stroke(ctx, 'M959 835 H1207 M952 842 H1214 M945 849 H1221', '#a8a58d', 2);
  groundShadow(ctx, 1047, 819, 103, 23);
  groundShadow(ctx, 1337, 832, 130, 23);
  doorstepPlant(ctx, 0.009 * Math.sin(time * TAU / 4));
}

function arrivalHomeowner(ctx, time) {
  const greeting = beat(time, 1.4, 1.15);
  const nod = beat(time, 1.95, 0.55);
  const breathe = Math.sin(time * TAU / 4) * 0.8;
  ctx.save();
  ctx.translate(1045, 0);

  path(ctx, 'M-51 563 Q-60 625 -53 690 L-54 797 Q-41 804 -21 797 L-11 687 L8 581Z', '#56665e');
  path(ctx, 'M0 577 L48 572 Q57 633 44 704 L40 799 Q25 807 6 800 L-2 692 L-15 619Z', '#65776b');
  stroke(ctx, 'M29 617 Q21 704 26 781 M-34 629 L-35 775', '#839184', 2);
  path(ctx, 'M-54 790 Q-38 796 -22 790 L-17 812 Q-13 822 -26 825 L-70 825 Q-78 819 -66 808Z', '#4b4c42');
  path(ctx, 'M8 792 Q24 797 40 791 L47 809 Q65 812 65 823 Q41 830 5 824Z', '#505347');
  stroke(ctx, 'M-68 822 H-21 M10 824 H59', '#8c8d77', 2);

  ctx.translate(0, breathe);
  path(ctx, 'M-48 373 C-76 378 -82 408 -83 450 L-80 561 L-56 565 L-44 470 L-26 401Z', P.sageDark);
  path(ctx, 'M-78 553 L-56 558 L-55 583 Q-44 604 -54 612 Q-68 612 -73 597 L-81 588Z', C.skin);
  stroke(ctx, 'M-64 585 L-61 600 M-72 586 L-68 601', C.skinShade, 1.5);

  ellipse(ctx, -30, 291 + nod * 2, 18, 22, P.silver);
  head(ctx, 4, 306 + nod * 2, 0.8, {
    hair: 'silver', smile: true, tilt: 0.015 + nod * 0.045,
    blink: beat(time, 3.16, 0.08) > 0.5,
  });
  path(ctx, 'M-31 361 Q-50 361 -65 382 L-55 477 L-66 590 Q-26 609 12 600 L54 589 L45 474 L62 386 Q43 367 24 364 Q12 389 -6 385Z',
    gradient(ctx, -63, 370, 66, 592, [[0, P.sageLight], [1, P.sage]]));
  path(ctx, 'M-25 369 Q-7 384 23 369 L37 582 Q7 592 -23 582Z', '#f4e8cf');
  path(ctx, 'M-30 367 L-16 391 L-26 579 L-42 589 Q-34 475 -43 401Z', '#9eb6a0');
  path(ctx, 'M24 367 L36 397 L32 590 L49 585 L46 414Z', '#6e917d');
  stroke(ctx, 'M-13 400 Q-5 407 16 400 M-14 451 Q5 456 23 448 M-17 547 Q2 555 23 550', '#ded1b5', 2);
  stroke(ctx, 'M-53 482 Q-43 496 -43 514 M-54 566 L-36 569 M33 565 L49 562', '#6c8c78', 2);
  for (const y of [424, 465, 506, 547]) ellipse(ctx, 31, y, 2.2, 2.5, '#d8d8ba');

  ctx.save();
  ctx.translate(49, 383);
  ctx.rotate(0.1 - 0.035 * greeting);
  ctx.scale(0.82, 1);
  path(ctx, 'M-8 -8 C14 -12 29 9 35 40 L43 73 L62 53 L80 68 Q59 108 39 110 C20 109 10 87 3 65 L-18 17Z', P.sage);
  path(ctx, 'M59 55 L72 37 Q79 29 84 19 L90 7 Q93 2 97 5 Q100 8 96 20 L94 28 L110 15 Q115 13 117 17 Q118 22 107 31 L103 36 L116 29 Q123 28 121 34 L107 45 Q96 54 88 58 L78 69Z', C.skin);
  stroke(ctx, 'M79 40 Q86 42 89 49 M101 35 L91 41', C.skinShade, 1.7);
  path(ctx, 'M57 55 L64 48 L83 61 L78 71Z', '#b0c1a8');
  stroke(ctx, 'M19 54 L31 81 Q36 91 45 90', '#668874', 2);
  ctx.restore();
  ctx.restore();
}

function toolbag(ctx, x, y, swing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  tool(ctx, 35, 18, Math.PI - 0.12, 0.55);
  round(ctx, -35, -30, 10, 52, 4, '#a98b59');
  round(ctx, -33, -50, 6, 25, 2, '#c2c9bd');
  stroke(ctx, 'M-39 6 C-39 -66 32 -66 34 6', '#344a4d', 9);
  stroke(ctx, 'M-39 6 C-39 -66 32 -66 34 6', '#6b7b6c', 3);
  path(ctx, 'M-62 -3 Q-12 -14 57 -2 L70 82 Q63 104 45 106 L-51 106 Q-70 100 -71 81Z', '#324b4c');
  path(ctx, 'M-62 -3 Q0 -11 57 -2 L53 16 Q-4 5 -62 17Z', '#607467');
  path(ctx, 'M-67 31 Q-7 20 64 29 L69 83 Q53 94 -65 91Z', '#42605a');
  path(ctx, 'M-24 39 H22 L26 84 H-28Z', '#688071');
  stroke(ctx, 'M-58 20 Q0 11 56 19 M-22 45 H20 M-57 39 L-60 79 M49 38 L55 78', '#94a08b', 2);
  line(ctx, [[-42, 5], [-44, 99]], '#253e40', 8);
  line(ctx, [[38, 6], [44, 99]], '#253e40', 8);
  for (const x of [-43, 40]) round(ctx, x - 5, 32, 11, 15, 2, '#a9b5a3', '#253e40', 2);
  ctx.restore();
}

function technician(ctx, time) {
  const greeting = beat(time, 1.25, 1.15);
  const nod = beat(time, 1.45, 0.54);
  const breath = Math.sin(time * TAU / 4 + 0.4) * 0.9;
  ctx.save();
  ctx.translate(1320, 0);
  path(ctx, 'M-66 533 L4 543 L-5 661 L-29 808 Q-48 818 -71 808 L-55 675Z', P.trouser);
  path(ctx, 'M0 546 L62 534 Q71 601 57 666 L65 805 Q46 816 23 808 L12 679 L-15 604Z', P.trouserLight);
  path(ctx, 'M-61 544 L-34 550 Q-26 613 -35 658 L-53 803 H-66 L-53 662Z', '#2d4551');
  stroke(ctx, 'M36 570 Q45 628 35 660 L45 792 M-42 677 L-26 681 M27 681 L55 677', '#4c626b', 2);
  path(ctx, 'M-70 797 L-30 799 L-25 821 Q-31 834 -88 834 Q-101 830 -97 821 L-76 812Z', '#263539');
  path(ctx, 'M24 797 L62 799 L72 814 Q91 818 88 831 Q59 839 17 831 L18 812Z', '#2b393b');
  stroke(ctx, 'M-92 831 H-29 M23 830 H83', '#6c746c', 3);
  stroke(ctx, 'M-72 815 L-49 817 M36 814 L59 818', '#879286', 2);

  toolbag(ctx, 113, 634 + breath, -0.012 + Math.sin(time * TAU / 4) * 0.008);
  ctx.translate(0, breath);
  head(ctx, -4, 281 + nod * 2, 0.83, {
    hair: 'short', flip: true, smile: true, tilt: -0.018 - nod * 0.045,
    blink: beat(time, 2.9, 0.07) > 0.5,
  });
  path(ctx, 'M-34 342 Q-54 344 -73 361 C-82 404 -77 459 -65 492 L-65 547 Q-5 563 64 545 L60 481 Q76 426 67 370 Q48 350 20 343 L-3 364Z',
    gradient(ctx, -68, 370, 64, 538, [[0, P.shirtLight], [0.65, C.blue], [1, P.shirtShade]]));
  path(ctx, 'M-34 341 L-8 361 L-22 384 L-46 357Z', '#b2cfca');
  path(ctx, 'M20 341 L-8 361 L5 383 L35 356Z', '#64a2b6');
  path(ctx, 'M-9 365 L-4 547 L6 548 L0 380Z', '#206886');
  stroke(ctx, 'M-61 478 Q-43 487 -26 483 M26 501 Q46 497 57 490 M-43 532 Q-26 536 -16 532', '#64a1b5', 2);
  path(ctx, 'M23 405 L53 403 L51 438 Q35 450 23 439Z', '#236c8a');
  stroke(ctx, 'M25 412 L50 410', '#6aa8b8', 2);
  line(ctx, [[41, 398], [42, 416]], '#dbd6bc', 3);
  for (const y of [395, 433, 471, 509]) ellipse(ctx, 1, y, 1.8, 2.1, '#b2c9c8');
  path(ctx, 'M-66 542 Q-3 555 64 540 L64 554 Q-4 568 -65 556Z', '#263b43');
  round(ctx, -6, 548, 20, 12, 2, '#7e9293', '#1d323a', 2);

  ctx.save();
  ctx.translate(-61, 366);
  ctx.rotate(greeting * 0.045);
  path(ctx, 'M-6 -9 C-28 -7 -37 14 -33 42 L-21 77 L9 68 L4 39 Q17 17 11 3Z', C.blue);
  path(ctx, 'M-25 66 L3 61 L9 80 L-20 89Z', '#73a6b8');
  path(ctx, 'M-21 82 Q-32 71 -47 44 L-54 23 L-39 16 L-27 37 Q-15 56 2 67 L7 80 Q-5 94 -21 82Z', C.skin);
  path(ctx, 'M-54 28 L-60 13 Q-65 6 -67 -4 L-70 -25 Q-69 -31 -65 -29 L-57 -10 L-57 -35 Q-55 -41 -51 -37 L-48 -13 L-45 -38 Q-42 -42 -39 -37 L-39 -11 L-34 -28 Q-31 -32 -28 -28 L-29 -6 L-24 -11 Q-19 -14 -18 -9 Q-19 2 -28 12 L-38 27 Q-47 34 -54 28Z', C.skin);
  stroke(ctx, 'M-56 4 Q-46 -1 -36 4 M-46 8 L-40 19', C.skinShade, 1.7);
  path(ctx, 'M-49 40 Q-36 66 -21 76 L-16 70 Q-35 51 -43 33Z', P.skinLight);
  ctx.restore();

  path(ctx, 'M57 358 C82 358 90 385 94 412 L101 468 L72 477 L58 423 L43 383Z', P.shirtShade);
  path(ctx, 'M72 460 L100 456 L105 480 L76 487Z', '#6e9eaf');
  path(ctx, 'M78 482 L102 477 L110 537 L118 581 L103 589 Q94 562 88 535Z', C.skin);
  path(ctx, 'M100 577 Q112 573 119 581 L124 593 Q131 602 126 609 Q121 615 117 605 L111 598 Q113 616 106 616 Q100 615 100 604 L95 587Z', C.skin);
  stroke(ctx, 'M106 591 L113 594 M109 600 L111 609', C.skinShade, 1.5);
  ctx.restore();
}

function roomSet(ctx) {
  ctx.fillStyle = gradient(ctx, 0, 0, 1550, 900, [[0, '#f8efdc'], [1, '#e3d3b5']]);
  ctx.fillRect(0, 0, 1600, 900);
  path(ctx, 'M0 787 H1600 V900 H0Z', '#b8aa8e');
  stroke(ctx, 'M0 780 H1600', '#f1e4c9', 12);
  stroke(ctx, 'M0 846 H1600 M292 787 L167 900 M728 787 L698 900', '#a3967f', 2);

  round(ctx, 58, 76, 739, 575, 3, '#c3c4ac');
  round(ctx, 70, 65, 710, 569, 2, '#fcf1d9');
  ctx.fillStyle = gradient(ctx, 86, 85, 715, 615, [[0, '#b1c8bd'], [1, '#e6ddba']]);
  ctx.fillRect(88, 85, 671, 526);
  path(ctx, 'M88 443 Q176 349 250 389 Q331 310 421 388 Q490 337 562 413 Q677 341 759 404 V611 H88Z', '#a9ba93');
  path(ctx, 'M88 526 Q210 447 308 490 Q418 414 512 480 Q629 426 759 482 V611 H88Z', '#8da986');
  stroke(ctx, 'M184 610 Q187 339 237 191 M214 350 L142 285 M215 344 L291 285 M622 611 Q621 430 675 330', '#8eaa8d', 10);
  for (const [x, y, a, s] of [[198, 379, -0.8, 1.4], [228, 309, 0.9, 1.6], [624, 543, -0.8, 1.3], [661, 433, 0.8, 1.5]]) {
    leaf(ctx, x, y, a, s, '#98b49a');
  }
  line(ctx, [[420, 85], [420, 612]], '#f7ecd5', 15);
  line(ctx, [[88, 350], [760, 350]], '#f7ecd5', 12);
  path(ctx, 'M48 621 H803 V641 H48Z', '#fff1d8');
  path(ctx, 'M48 641 H803 L839 663 H77Z', '#c7b99d');
  path(ctx, 'M681 55 H812 C797 233 800 440 835 654 L756 650 C715 457 739 255 681 55Z', '#ece1c7');
  stroke(ctx, 'M724 74 C766 298 741 451 789 634 M779 74 Q760 370 813 634', '#d7cfb6', 3);
  path(ctx, 'M111 652 L688 652 L1084 900 H439Z', 'rgba(255, 246, 214, 0.20)');
  path(ctx, 'M780 118 L904 118 L1359 787 H1236Z', 'rgba(255, 247, 215, 0.16)');

  round(ctx, 944, 114, 191, 131, 2, '#b79972');
  round(ctx, 951, 121, 177, 117, 1, '#eee3c9');
  path(ctx, 'M969 218 Q1010 155 1109 190 V222 H969Z', '#a8b29a');
  stroke(ctx, 'M1030 217 Q1028 178 1057 144 M1033 190 L1004 169 M1042 167 L1079 164', '#64816b', 3);
  leaf(ctx, 1035, 190, -0.8, 0.4, '#75917a');
  leaf(ctx, 1041, 171, 0.9, 0.4, '#8a9d82');

  line(ctx, [[1537, 347], [1537, 708]], '#8b8b70', 8);
  ellipse(ctx, 1537, 712, 55, 11, '#8e8d74');
  path(ctx, 'M1487 215 Q1537 201 1587 215 L1614 351 Q1538 373 1461 351Z', '#f2e5c7');
  ellipse(ctx, 1537, 351, 77, 13, '#d9c8a7');
  stroke(ctx, 'M1501 225 L1486 342 M1574 225 L1588 344', '#e1d3b6', 2);

  path(ctx, 'M777 691 C778 637 820 606 879 606 L1515 605 Q1587 607 1600 667 V900 H733Z', '#6c9286');
  path(ctx, 'M802 685 Q802 638 849 632 L1489 632 Q1531 634 1547 669 L1537 789 H802Z', '#86a79a');
  stroke(ctx, 'M1015 643 Q997 697 1013 770 M1281 643 Q1297 706 1286 765', '#6b9183', 3);
  path(ctx, 'M783 787 Q1142 757 1540 786 L1585 900 H753Z', '#779b8c');
  path(ctx, 'M746 715 Q738 686 769 679 Q806 674 819 711 L849 900 H725Z', '#5c8376');
  path(ctx, 'M1516 721 Q1514 687 1554 686 Q1587 683 1600 710 V900 H1499Z', '#638a7b');
  stroke(ctx, 'M824 808 Q1134 787 1509 808', '#a2b8a2', 2);
  path(ctx, 'M879 666 Q901 650 948 667 L986 758 Q943 780 887 764Z', '#b6b99b');
  stroke(ctx, 'M889 677 L902 752 M903 674 L917 754 M919 677 L931 757', '#cbc7a8', 2);

  // A low table and ordinary objects anchor the portrait in a lived-in room.
  path(ctx, 'M491 800 Q669 753 907 795 L925 823 Q702 874 474 833Z', '#a57f59');
  path(ctx, 'M491 794 Q691 750 910 790 L920 808 Q712 858 479 820Z', '#c7a576');
  path(ctx, 'M519 828 L538 900 H558 L544 833 M868 819 L855 900 H875 L895 815Z', '#866e51');
  path(ctx, 'M629 789 L737 777 L782 799 L671 813Z', '#6a887d');
  path(ctx, 'M635 794 L736 784 L774 801 L671 810Z', '#efe4c9');
  path(ctx, 'M629 789 L737 777 L782 795 L671 808Z', '#8b9b80');
  ellipse(ctx, 840, 797, 37, 10, '#b0916b');
  path(ctx, 'M817 747 H857 L853 788 Q838 801 821 788Z', '#f4e7ca');
  stroke(ctx, 'M858 755 C885 749 884 782 856 782', '#f4e7ca', 7);
  ellipse(ctx, 837, 748, 20, 6, '#ded0b3');
  ellipse(ctx, 837, 749, 15, 3.5, '#816d50');
}

function phone(ctx, angle) {
  ctx.save();
  ctx.translate(1409, 608);
  ctx.rotate(angle);
  path(ctx, 'M-34 -63 Q-48 -46 -45 -19 Q-36 10 -14 12 L27 4 Q51 -9 46 -38 L36 -80Z', C.skinShade);
  round(ctx, -43, -166, 88, 166, 12, '#253b40', '#9ba99e', 2);
  round(ctx, -37, -158, 76, 148, 8, '#f3ecd9');
  round(ctx, -13, -161, 28, 4, 2, '#687975');
  path(ctx, 'M-30 -145 H30 L-30 -76Z', 'rgba(255,255,255,0.16)');
  // Wordless, unbranded conversation artwork, with no delivery/result semantics.
  round(ctx, -29, -133, 50, 33, 8, '#c6d8cc');
  path(ctx, 'M-24 -104 L-30 -94 L-12 -101Z', '#c6d8cc');
  for (const x of [-17, -5, 7]) ellipse(ctx, x, -117, 2.5, 2.5, '#5c7f73');
  round(ctx, -9, -80, 40, 30, 8, '#d9c2a4');
  path(ctx, 'M22 -54 L33 -45 L29 -63Z', '#d9c2a4');
  for (const x of [1, 11, 21]) ellipse(ctx, x, -65, 2.1, 2.1, '#897052');
  round(ctx, -29, -35, 35, 13, 6, '#d8dfce');
  path(ctx, 'M41 -53 Q51 -58 53 -50 L51 -27 Q48 -19 43 -23 L39 -37Z', C.skin);
  path(ctx, 'M43 -30 Q54 -32 52 -22 L48 -7 Q42 0 36 -6 L39 -20Z', C.skin);
  stroke(ctx, 'M44 -47 L44 -34 M45 -24 L43 -13', C.skinShade, 1.5);
  ctx.restore();
}

function contactHomeowner(ctx, time) {
  const breath = Math.sin(time * TAU / 4) * 1.4;
  const attention = beat(time, 1.62, 1.15);
  const tap = Math.max(beat(time, 1.32, 0.23), beat(time, 1.96, 0.21));
  const angle = 0.09 + Math.sin(time * TAU / 4) * 0.008;
  ctx.save();
  ctx.translate(0, breath);
  path(ctx, 'M1067 779 Q1206 757 1319 792 L1393 900 H1003Z', '#647970');
  stroke(ctx, 'M1126 831 Q1163 867 1165 900 M1276 829 L1305 900', '#8b9b88', 3);
  path(ctx, 'M1253 436 Q1298 431 1319 480 L1336 590 L1354 634 L1396 591 L1418 611 Q1399 654 1366 676 Q1337 696 1314 673 L1265 585 L1223 480Z', P.sageDark);
  path(ctx, 'M1361 627 L1397 584 Q1407 571 1420 578 L1435 598 Q1416 630 1380 651Z', C.skin);
  stroke(ctx, 'M1375 631 L1400 606', P.skinLight, 3);

  ellipse(ctx, 1138, 299 + attention * 2, 26, 34, P.silver);
  head(ctx, 1190, 323 + attention * 2.5, 1.18, {
    hair: 'silver', tilt: 0.13 + attention * 0.045, smile: false,
    blink: beat(time, 3.15, 0.08) > 0.5,
  });
  path(ctx, 'M1141 426 Q1091 418 1062 452 Q1036 489 1049 544 L1083 654 L1062 809 Q1165 850 1311 809 L1288 656 L1300 520 Q1306 466 1256 440 L1221 429 Q1179 457 1141 426Z',
    gradient(ctx, 1060, 450, 1313, 810, [[0, '#a2b9a2'], [0.65, P.sage], [1, '#709481']]));
  path(ctx, 'M1142 432 Q1186 458 1222 436 L1261 806 Q1199 826 1120 805Z', '#f4e6c9');
  path(ctx, 'M1142 429 L1160 460 L1131 804 L1099 815 Q1130 625 1118 463Z', '#a9bda4');
  path(ctx, 'M1222 432 L1251 464 L1281 814 L1254 815 Q1247 614 1222 432Z', '#729581');
  stroke(ctx, 'M1159 481 Q1185 496 1220 481 M1149 544 Q1172 555 1228 542 M1138 746 Q1183 761 1243 748', '#d7c9ab', 2.5);
  stroke(ctx, 'M1084 551 Q1100 576 1104 606 M1083 770 Q1098 778 1112 775 M1272 737 L1288 752', '#648775', 2.5);
  for (const y of [508, 566, 624, 682, 740]) ellipse(ctx, 1253 + (y - 508) * 0.06, y, 3.1, 3.5, '#d3d5b6');
  path(ctx, 'M1065 455 C1030 472 1034 524 1043 566 L1071 651 Q1083 690 1115 702 Q1143 708 1176 682 L1269 620 L1252 586 L1140 644 Q1125 650 1121 637 L1104 566 L1112 481Z', '#89a791');
  path(ctx, 'M1246 587 L1262 578 L1283 612 L1267 625Z', '#b4c3a9');
  stroke(ctx, 'M1066 549 L1087 624 Q1091 642 1102 654 M1113 681 Q1129 682 1141 671 M1171 653 L1249 607', '#658a76', 2.5);
  stroke(ctx, 'M1097 485 Q1086 514 1095 541', '#b4c4a9', 2);
  phone(ctx, angle);

  // The fingertip approaches a fixed point on the moving, hand-held screen.
  // No response is fabricated when it touches: this is a contact moment only.
  const targetX = 1409 - 24 * Math.cos(angle) + 63 * Math.sin(angle);
  const targetY = 608 - 24 * Math.sin(angle) - 63 * Math.cos(angle);
  const tipX = targetX - 10 * (1 - tap);
  const tipY = targetY + 3 * (1 - tap);
  path(ctx, `M1265 589 L1295 574 Q1314 562 1334 565
    L1350 552 Q1358 547 ${tipX - 14} ${tipY - 5}
    Q${tipX + 4} ${tipY - 8} ${tipX + 4} ${tipY - 1}
    Q${tipX + 4} ${tipY + 5} ${tipX - 9} ${tipY + 6}
    L1358 568 Q1362 576 1354 582 Q1356 591 1346 596
    Q1345 607 1333 608 Q1320 620 1301 614 L1281 612Z`, C.skin);
  path(ctx, 'M1268 590 L1299 580 Q1316 572 1333 575 L1348 565 L1353 570 L1337 585 Q1317 584 1305 592 L1278 605Z', P.skinLight);
  stroke(ctx, 'M1316 598 Q1325 588 1336 587 M1334 608 L1326 602 M1346 596 L1336 590 M1354 582 L1344 577', C.skinShade, 1.8);
  stroke(ctx, `M${tipX - 6} ${tipY - 2} L${tipX - 1} ${tipY - 2}`, '#f2d0b1', 2.5);
  ctx.restore();
}

export function drawArrival(ctx, t) {
  const time = cycle(t);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  arrivalSet(ctx, time);
  arrivalHomeowner(ctx, time);
  technician(ctx, time);
  // Edge foliage supplies a foreground plane without crossing either face.
  leaf(ctx, 1614, 839, -0.65, 1.62, P.leafDark);
  leaf(ctx, 1612, 747, -0.68, 1.38, P.leaf);
  leaf(ctx, 1585, 898, -1.0, 1.27, '#426b55');
  ctx.restore();
}

export function drawContact(ctx, t) {
  const time = cycle(t);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  roomSet(ctx);
  contactHomeowner(ctx, time);
  ctx.restore();
}

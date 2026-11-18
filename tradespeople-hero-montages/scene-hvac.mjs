import { C, path, line, ellipse, round, poly, limb } from './paint.mjs';

const TAU = Math.PI * 2;
const PERIOD = 4;

function easeBetween(start, end, value) {
  const u = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return u * u * (3 - 2 * u);
}

function wash(ctx, x0, y0, x1, y1, stops) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  return gradient;
}

function ovalStroke(ctx, x, y, rx, ry, color, width = 2) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function groundShadow(ctx, x, y, rx, ry, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const shade = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1);
  shade.addColorStop(0, `rgba(16, 45, 58, ${opacity})`);
  shade.addColorStop(0.62, `rgba(16, 45, 58, ${opacity * 0.48})`);
  shade.addColorStop(1, 'rgba(16, 45, 58, 0)');
  ellipse(ctx, 0, 0, 1, 1, shade);
  ctx.restore();
}

function gardenExterior(ctx) {
  ctx.fillStyle = wash(ctx, 0, 0, 1510, 760, [
    [0, '#f5efdf'],
    [0.56, '#e8dfcb'],
    [1, '#c9d1c2'],
  ]);
  ctx.fillRect(0, 0, 1600, 900);

  // The wall and paving continue beyond the shot: there is no display platform.
  path(ctx, 'M0 0H1600V45L0 77Z', '#d2d3bd');
  path(ctx, 'M0 67L1600 34V51L0 89Z', '#c4cbb9');
  path(ctx, 'M0 89L1600 51V96L0 132Z', wash(ctx, 0, 65, 0, 135, [
    [0, '#ccd0ba'],
    [1, 'rgba(204, 208, 186, 0)'],
  ]));
  poly(ctx, [[320, 89], [1104, 70], [874, 698], [0, 698], [0, 587]],
    'rgba(255, 249, 226, 0.30)');

  path(ctx, 'M1470 53L1600 49V724L1470 702Z', '#bdcbc0');
  line(ctx, [[1470, 56], [1470, 700]], '#d9dfcc', 3);
  path(ctx, 'M0 684Q596 678 1042 690L1600 708V739H0Z', '#bac3b1');
  path(ctx, 'M0 697Q670 691 1110 702L1600 717V900H0Z',
    wash(ctx, 0, 698, 0, 900, [
      [0, '#d6d4bd'],
      [1, '#eee3cc'],
    ]));
  line(ctx, [[0, 774], [945, 755], [1600, 772]], '#c6c8b3', 2);
  line(ctx, [[0, 886], [1000, 850], [1600, 884]], '#c9c7af', 2);
  line(ctx, [[847, 703], [583, 900]], '#c8c9b3', 1.6);
  line(ctx, [[1134, 705], [1206, 900]], '#c9c9b2', 1.6);
  line(ctx, [[1397, 712], [1600, 843]], '#c9c9b2', 1.6);

  // A deeply set domestic window establishes adult scale behind the worker.
  round(ctx, 829, 105, 212, 266, 3, 'rgba(73, 99, 91, 0.12)');
  round(ctx, 840, 94, 194, 265, 2, '#c5cabb');
  round(ctx, 850, 102, 175, 247, 1, '#edf0dc');
  round(ctx, 860, 112, 155, 226, 0,
    wash(ctx, 860, 112, 1015, 338, [
      [0, '#799d99'],
      [0.6, '#a9c5b7'],
      [1, '#ced4be'],
    ]));
  path(ctx, 'M862 114H914Q907 199 899 266L885 338H862Z', '#d3ddc8');
  path(ctx, 'M865 115H884L875 337H863Z', '#e7e8d1');
  path(ctx, 'M946 114H1013V205L946 251Z', 'rgba(229, 241, 220, 0.27)');
  line(ctx, [[938, 111], [938, 339]], '#e4e6d0', 7);
  line(ctx, [[859, 242], [1016, 242]], '#e4e6d0', 7);
  line(ctx, [[862, 339], [1016, 339]], '#7c9a92', 3);
  poly(ctx, [[831, 354], [1036, 354], [1047, 368], [831, 368]], '#f1ead5');
  path(ctx, 'M831 368H1047V377H838Z', '#b6c1ae');

  // Broad silhouettes keep the copy side quiet, rather than filling it with leaves.
  path(ctx, 'M0 676C76 632 141 665 217 640C276 618 335 654 395 641C466 621 537 653 599 643C676 628 735 653 777 688L796 733H0Z',
    '#afc1a8');
  path(ctx, 'M0 700C113 678 169 695 240 681C322 667 384 704 478 689C555 674 663 702 741 690L799 746H0Z',
    '#8ea98f');
  path(ctx, 'M0 739C177 722 364 755 528 733C623 721 700 736 779 749L795 767H0Z',
    '#6e917d');
  path(ctx, 'M0 762Q435 749 794 769L809 782Q452 763 0 779Z', '#c5c9b0');

  // Fixed, sparse plaster marks; no time-varying grain.
  for (const [x, y, width] of [
    [794, 424, 15], [820, 527, 8], [1127, 134, 13],
    [1184, 250, 7], [1295, 162, 16], [1375, 312, 10],
    [1178, 411, 11], [1434, 113, 9], [1333, 384, 13],
  ]) {
    line(ctx, [[x, y], [x + width, y - 1]], 'rgba(111, 130, 113, 0.15)', 1.4);
  }
}

function wallServices(ctx) {
  // Everything remains closed and inert; the work is on a casing fastener.
  round(ctx, 1433, 319, 65, 99, 5, 'rgba(43, 74, 73, 0.12)');
  round(ctx, 1426, 311, 64, 98, 4, '#bac9c0', '#8ba399', 1.5);
  round(ctx, 1434, 320, 48, 77, 3, '#d8dece');
  round(ctx, 1450, 343, 17, 34, 3, '#536d69');
  round(ctx, 1453, 362, 11, 12, 2, '#e4e5cf');
  ellipse(ctx, 1441, 328, 2, 2, '#80968c');
  ellipse(ctx, 1475, 390, 2, 2, '#80968c');
  path(ctx, 'M1458 410V438Q1458 448 1471 448H1490Q1502 448 1502 462V641',
    null, '#8a9e97', 11);
  path(ctx, 'M1456 410V438Q1456 451 1470 451H1490Q1498 451 1498 464V638',
    null, '#ced5c5', 5);

  path(ctx, 'M1408 420H1420Q1433 420 1433 435V469Q1433 484 1447 484H1478Q1487 484 1487 499V660Q1487 677 1465 677',
    null, '#284c4e', 20);
  path(ctx, 'M1409 416H1420Q1437 416 1437 436V467',
    null, '#52726a', 5);
  round(ctx, 1400, 403, 21, 33, 5, '#a4b7aa');
  line(ctx, [[1423, 448], [1444, 448]], '#89a497', 5);
  line(ctx, [[1477, 557], [1497, 557]], '#89a497', 5);
  path(ctx, 'M1409 447H1418Q1420 447 1420 456V481Q1420 496 1442 496H1507Q1517 496 1517 509V689Q1517 701 1492 701',
    null, '#af8968', 6);
}

function trousersAndBoots(ctx) {
  path(ctx, 'M1007 550Q1041 543 1063 566L1093 685L1119 790Q1103 807 1079 801L1049 712L1002 640Z',
    '#234454');
  path(ctx, 'M1044 570L1081 692L1107 797L1095 800L1059 700L1026 609Z',
    '#173746');
  path(ctx, 'M966 548Q1001 539 1040 566L1001 678L963 801Q936 812 911 794L930 674Z',
    '#294c5b');
  path(ctx, 'M1013 570L986 672L951 798L963 800L1003 677L1039 566Z',
    '#153441');
  path(ctx, 'M968 569Q949 622 946 665L930 737L935 669L958 577Z',
    '#3b5f6b');
  path(ctx, 'M949 613L986 623L974 666Q955 671 940 657Z',
    '#315563', '#65808a', 1.4);
  line(ctx, [[948, 621], [983, 630]], '#7b9294', 1.3);
  line(ctx, [[935, 689], [959, 678], [948, 697]], '#183a48', 2.5);
  line(ctx, [[1046, 690], [1073, 698]], '#56727b', 2);
  line(ctx, [[922, 776], [963, 785]], '#71858a', 2);
  line(ctx, [[1077, 777], [1114, 768]], '#647d83', 2);

  path(ctx, 'M1079 786L1117 781L1129 807Q1151 811 1160 822L1163 834L1076 836Q1066 832 1069 817Z',
    '#213c42');
  path(ctx, 'M1117 796L1129 807Q1151 811 1160 822L1130 825L1106 811Z',
    '#49605d');
  path(ctx, 'M1073 829L1162 827L1163 838L1075 839Z', '#9c8062');
  line(ctx, [[1105, 804], [1122, 799]], '#b6b5a0', 2);
  line(ctx, [[1110, 812], [1128, 807]], '#b6b5a0', 2);

  path(ctx, 'M912 785L956 793L951 807L979 815Q993 820 993 833L974 839H895Q884 836 891 818Z',
    '#294448');
  path(ctx, 'M951 807L978 815Q991 820 992 830L960 831L938 820Z',
    '#52635d');
  path(ctx, 'M890 831Q941 836 993 829L992 840L893 841Z', '#b1936d');
  line(ctx, [[928, 806], [947, 810]], '#c3c0a3', 2);
  line(ctx, [[925, 813], [946, 817]], '#c3c0a3', 2);
  line(ctx, [[922, 820], [940, 824]], '#c3c0a3', 2);
}

function toolBag(ctx) {
  groundShadow(ctx, 873, 827, 73, 15, 0.16);
  path(ctx, 'M834 775Q874 765 921 777L930 820Q883 836 832 820Z', '#47676a');
  path(ctx, 'M834 775Q875 784 921 777L918 790Q878 801 837 789Z', '#2a4a51');
  path(ctx, 'M851 777L854 756Q873 739 893 757L896 777',
    null, '#315256', 8);
  path(ctx, 'M850 782L854 817M899 784L906 821', null, '#94a996', 5);
  path(ctx, 'M864 803H890V823H864Z', '#6c867b');
  line(ctx, [[865, 808], [888, 808]], '#a2b39b', 1.5);
  line(ctx, [[906, 778], [912, 748]], '#bdc8bc', 6);
  round(ctx, 906, 743, 11, 17, 3, '#b68663');
}

function faceAndCap(ctx, x, y, tilt, blink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(0.96, 0.96);

  path(ctx, 'M-25 34L-28 76Q-8 92 14 69L15 31Z', C.skin);
  path(ctx, 'M-24 39Q-10 57 13 48L10 67Q-9 71 -26 58Z', C.skinShade);
  path(ctx, 'M-35-38C-22-55 10-55 28-39Q40-24 37-8L48 9Q48 15 37 17L34 34Q25 52 8 58Q-9 58-22 47L-35 31Q-48 18-46 0Z',
    wash(ctx, -42, -20, 42, 44, [
      [0, '#c68b68'], [0.55, '#e1ae88'], [1, '#d9a07b'],
    ]));
  path(ctx, 'M-36-35Q-18-48 4-42L-12-24L-19 2L-17 35Q-31 31-37 14Z',
    '#bb805e');
  path(ctx, 'M8 3Q24-1 35 14L29 24Q15 28 9 19Z', '#e8b993');
  path(ctx, 'M-43-13L-45-41Q-29-58 5-54Q27-48 30-35L10-28L-9-33L-23-14L-25 12L-34 11Z',
    C.hair);
  path(ctx, 'M-28 0C-46-7-46 23-31 26L-24 18Z', '#d59c76');
  path(ctx, 'M-34 6Q-41 7-35 18L-30 14', null, '#a46b50', 2);
  path(ctx, 'M-19 29Q-4 44 10 43L30 32Q28 48 10 55Q-7 54-19 43Z',
    'rgba(113, 77, 59, 0.24)');
  line(ctx, [[-7, 44], [-4, 47]], '#b47c5b', 1);
  line(ctx, [[1, 47], [4, 49]], '#b47c5b', 1);
  line(ctx, [[10, 48], [13, 47]], '#b47c5b', 1);

  path(ctx, 'M4-10Q13-15 24-10', null, C.hair, 3.2);
  path(ctx, 'M30-12Q35-14 39-10', null, C.hair, 2.5);
  const opening = 1 - blink;
  if (opening > 0.12) {
    ctx.save();
    ctx.translate(15, -3);
    ctx.scale(1, opening);
    path(ctx, 'M-10 0Q-2-6 10 0Q1 5-10 0Z', '#f3e8d7');
    ellipse(ctx, 5, 0.6, 2.6, 3.1, C.ink);
    path(ctx, 'M-10 0Q-2-6 10 0', null, '#624b3c', 1.7);
    ctx.restore();
    ctx.save();
    ctx.translate(34, -5);
    ctx.scale(1, opening);
    path(ctx, 'M-4 0Q0-4 6 0Q1 3-4 0Z', '#eadbc6');
    ellipse(ctx, 3.3, 0.5, 1.6, 2.3, C.ink);
    ctx.restore();
  } else {
    path(ctx, 'M5-3Q14 1 24-3M30-5Q34-2 40-5', null, '#624b3c', 1.8);
  }
  path(ctx, 'M29-2Q29 7 38 12L32 16', null, '#b47d59', 1.8);
  path(ctx, 'M34 16L38 15', null, '#855a44', 1.6);
  path(ctx, 'M16 31Q24 33 32 28', null, '#875b48', 1.8);
  path(ctx, 'M21 37Q26 38 29 35', null, '#eac09a', 1.6);
  path(ctx, 'M-13 25Q-7 22-4 23', null, '#ba8663', 1.1);

  path(ctx, 'M-49-40Q-49-65-23-71C3-76 28-60 36-39L21-25L-37-23Z', '#245b74');
  path(ctx, 'M-49-40Q-48-63-25-70L-16-67Q-34-53-33-29L-42-25Z', '#39778a');
  path(ctx, 'M-11-69Q8-57 9-30', null, '#6d99a2', 1.5);
  path(ctx, 'M-43-30Q-10-37 28-30Q54-27 59-16Q53-10 36-13L9-20L-35-19Z',
    '#183e53');
  path(ctx, 'M-39-29Q-5-34 27-28Q47-25 55-18', null, '#6a95a0', 2);
  ctx.restore();
}

function farArm(ctx, sway, breath) {
  limb(ctx, [[1100 + sway, 384 + breath], [1154, 443]], 48, '#22637c', '#17465b');
  limb(ctx, [[1153, 443], [1194, 469], [1230, 484]], 29, C.skin, C.skinShade);
  ctx.save();
  ctx.translate(1151, 441);
  ctx.rotate(-0.56);
  round(ctx, -24, -9, 48, 18, 5, '#4c8b9b');
  line(ctx, [[-19, -4], [19, -4]], '#8bb0b0', 1.4);
  ctx.restore();
}

function shirt(ctx, sway, breath) {
  ctx.save();
  ctx.translate(sway, breath);
  path(ctx, 'M1076 347C1054 344 1028 358 1016 383L984 458Q974 502 954 545Q1001 578 1063 580L1092 498Q1110 452 1125 414C1138 392 1126 374 1104 364Z',
    wash(ctx, 1000, 363, 1110, 555, [
      [0, '#367e99'], [0.57, '#28718e'], [1, '#20566f'],
    ]));
  path(ctx, 'M1111 377Q1133 388 1123 416L1092 501L1063 580L1037 576Q1075 513 1085 452Z',
    '#20566d');
  path(ctx, 'M1029 365Q1008 403 995 458L969 540L983 548Q1003 466 1024 427L1050 369Z',
    '#458da2');
  path(ctx, 'M961 541Q1014 566 1065 567L1063 580Q1001 579 954 550Z',
    '#173e53');
  path(ctx, 'M970 551Q1004 567 1063 570L1061 580Q1009 579 966 563Z',
    '#8c856a');
  poly(ctx, [[1020, 565], [1034, 568], [1031, 579], [1017, 576]],
    '#c4b38d', '#405a59', 2);

  path(ctx, 'M1084 347L1104 349L1110 371L1092 380Z', '#e0dfc8');
  path(ctx, 'M1063 353L1085 341L1109 370L1089 391Z', '#43889f');
  path(ctx, 'M1108 347L1123 363L1128 381L1110 392L1108 371Z', '#1d526c');
  line(ctx, [[1066, 356], [1088, 386], [1105, 371]], '#82a5aa', 1.6);
  path(ctx, 'M1109 390Q1097 438 1079 488L1059 550', null, '#153f54', 2.2);
  path(ctx, 'M1105 392Q1093 439 1075 487', null, '#77a0aa', 1);
  for (const [x, y] of [[1103, 406], [1092, 444], [1079, 483], [1067, 523]]) {
    ellipse(ctx, x, y, 2, 2.3, '#b4c6bf');
  }

  poly(ctx, [[1069, 410], [1098, 420], [1085, 462], [1072, 466], [1056, 452]],
    '#29647f', '#6996a3', 1.2);
  line(ctx, [[1067, 418], [1095, 428]], '#9db8b9', 1.3);
  line(ctx, [[1081, 415], [1087, 393]], '#c9cfc0', 3);
  line(ctx, [[1083, 414], [1088, 398]], '#204355', 1);
  path(ctx, 'M986 501Q1008 515 1022 516M994 534L1021 540M1039 473Q1051 470 1058 464',
    null, '#194f69', 2.3);
  path(ctx, 'M1000 384Q1017 369 1041 367', null, '#92b2b6', 1.5);
  ctx.restore();
}

function condenser(ctx, screwAngle) {
  groundShadow(ctx, 1355, 813, 207, 32, 0.23);
  round(ctx, 1223, 765, 40, 35, 4, '#435f60');
  round(ctx, 1423, 761, 39, 38, 4, '#3c595b');
  round(ctx, 1220, 792, 46, 9, 3, '#a4aaa0');
  round(ctx, 1420, 792, 47, 9, 3, '#a4aaa0');

  poly(ctx, [[1476, 504], [1510, 480], [1510, 747], [1476, 774]], '#7d9a98');
  poly(ctx, [[1485, 520], [1503, 508], [1503, 731], [1485, 744]], '#658785');
  for (let i = 0; i < 17; i += 1) {
    const y = 534 + i * 11;
    line(ctx, [[1488, y], [1501, y - 9]], '#a9beb4', 3);
  }
  round(ctx, 1193, 504, 283, 271, 7,
    wash(ctx, 1200, 506, 1450, 775, [
      [0, '#e6e8d7'], [0.6, '#d6dece'], [1, '#bdcec3'],
    ]), '#a2b6ab', 1.5);
  poly(ctx, [[1193, 504], [1237, 480], [1510, 480], [1476, 504]], '#edf0dc');
  line(ctx, [[1195, 506], [1475, 506], [1509, 482]], '#f8f6e5', 2.5);
  line(ctx, [[1198, 753], [1472, 753]], '#a5bbb0', 1.5);
  line(ctx, [[1198, 756], [1471, 756]], '#edf0dd', 1.5);
  round(ctx, 1205, 526, 48, 212, 4, '#c3d1c7', '#9eb6a9', 1.2);
  line(ctx, [[1212, 534], [1246, 534]], '#dfe5d4', 1.5);
  round(ctx, 1216, 643, 25, 55, 2, '#b4c6ba');
  for (let i = 0; i < 5; i += 1) {
    line(ctx, [[1220, 650 + i * 9], [1237, 650 + i * 9]], '#91aa9c', 2);
  }
  ellipse(ctx, 1224, 552, 6, 6, '#9caea1');
  ellipse(ctx, 1224, 552, 4, 4, '#e4e7d5');
  ctx.save();
  ctx.translate(1224, 552);
  ctx.rotate(screwAngle);
  line(ctx, [[-3, 0], [3, 0]], '#556f68', 1.5);
  line(ctx, [[0, -3], [0, 3]], '#556f68', 1.5);
  ctx.restore();
  ellipse(ctx, 1225, 722, 4, 4, '#91a89b');
  line(ctx, [[1223, 724], [1227, 720]], '#e1e6d4', 1.5);

  ctx.save();
  ctx.translate(1361, 634);
  ctx.scale(1, 1.055);
  ellipse(ctx, 0, 0, 96, 96, '#9eb5ab');
  ellipse(ctx, 0, 0, 91, 91, '#314e53');
  ellipse(ctx, -1, 0, 86, 86, '#3c5a5d');
  // The three blades are deliberately stationary, independent of scene time.
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.rotate(i * TAU / 3 + 0.24);
    path(ctx, 'M-8-7C-39-32-43-66-25-75C-4-85 29-78 32-66C36-47 7-34-8-7Z', '#69817c');
    path(ctx, 'M-8-7Q-8-40 21-62', null, '#81958a', 1.8);
    ctx.restore();
  }
  for (const radius of [28, 44, 60, 76, 89]) {
    ovalStroke(ctx, 0, 0, radius, radius, '#b2c5b8', radius === 89 ? 3 : 1.7);
  }
  for (let i = 0; i < 20; i += 1) {
    const angle = i * TAU / 20;
    line(ctx, [
      [Math.cos(angle) * 18, Math.sin(angle) * 18],
      [Math.cos(angle) * 90, Math.sin(angle) * 90],
    ], '#a9bfb1', 1.5);
  }
  ellipse(ctx, 0, 0, 18, 18, '#b8cbbd');
  ellipse(ctx, -2, -2, 12, 12, '#ced8c6');
  ellipse(ctx, -3, -3, 4, 4, '#a0b7a9');
  ovalStroke(ctx, 0, 0, 96, 96, '#e4e8d5', 3);
  ctx.restore();
}

function stabilizingHand(ctx) {
  path(ctx, 'M1218 471Q1231 470 1243 481L1271 487Q1283 490 1278 497L1263 495L1277 500Q1283 504 1279 509L1261 504L1273 511Q1277 517 1270 519L1254 511Q1241 511 1230 500L1216 492Z',
    C.skin);
  path(ctx, 'M1231 497Q1243 507 1254 507L1271 516', null, C.skinShade, 2);
  path(ctx, 'M1246 488Q1256 492 1263 495M1242 495L1261 504', null, '#b17b58', 1.8);
  path(ctx, 'M1226 478Q1234 479 1242 487', null, '#edc49e', 2.5);
}

function workingArm(ctx, sway, breath, phase, roll, release) {
  const elbowX = 1081 + sway + Math.sin(phase * 2) * 2;
  const elbowY = 480 + breath + Math.cos(phase * 2) * 1.3;

  limb(ctx, [[elbowX, elbowY], [1105, 510], [1149, 538]], 29, C.skin, C.skinShade);
  path(ctx, `M${elbowX + 5} ${elbowY + 1}Q1108 500 1146 529`,
    null, '#e7b28a', 5);
  path(ctx, `M${1036 + sway} ${379 + breath}Q${1065 + sway} ${374 + breath} ${1082 + sway} ${399 + breath}L${elbowX + 18} ${elbowY - 9}Q${elbowX + 6} ${elbowY + 8} ${elbowX - 18} ${elbowY + 5}L${1038 + sway} ${443 + breath}Q${1020 + sway} ${402 + breath} ${1036 + sway} ${379 + breath}Z`,
    '#2c7895');
  path(ctx, `M${1040 + sway} ${386 + breath}Q${1034 + sway} ${411 + breath} ${1051 + sway} ${444 + breath}L${elbowX - 8} ${elbowY - 6}`,
    null, '#5895a7', 3);
  ctx.save();
  ctx.translate(elbowX, elbowY - 3);
  ctx.rotate(-0.39);
  round(ctx, -25, -8, 50, 18, 4, '#5b94a3');
  line(ctx, [[-21, -3], [21, -3]], '#9dbdbb', 1.4);
  line(ctx, [[-20, 6], [20, 6]], '#2b657d', 1.4);
  ctx.restore();

  // The tip never leaves the fastener. Wrist roll is around the tool's shaft,
  // not a swinging tool orbit; regrips leave the screw at its new angle.
  ctx.save();
  ctx.translate(1224, 552);
  ctx.rotate(0.18);
  path(ctx, 'M-47-3H-7L0-1V1L-7 3H-47Z', '#899e9d');
  line(ctx, [[-46, -1.5], [-5, -1.5]], '#f1efdb', 2);
  round(ctx, -53, -7, 9, 14, 3, '#304e55');
  path(ctx, 'M-88-10Q-96-9-96 0Q-96 10-88 11L-49 8Q-42 0-49-8Z', '#b87a50');
  line(ctx, [[-90, roll * 5], [-51, roll * 5]], '#ebbc83', 3);
  line(ctx, [[-90, roll * 5 + 6], [-51, roll * 5 + 4]], '#754e3a', 1.6);
  round(ctx, -96, -6, 7, 12, 3, '#304c51');

  ctx.translate(-69, 0);
  ctx.rotate(roll * 0.14);
  const lift = release * 2.5;
  path(ctx, `M-20 5C-24-3-18-15-8-18C3 ${-23 - lift} 15 ${-18 - lift} 18-12L23-6Q29 3 21 9L7 18Q-3 22-14 15Z`,
    C.skin);
  path(ctx, 'M-14 12Q-2 20 8 14L21 5', null, C.skinShade, 3);
  path(ctx, `M-4 ${-15 - lift}Q7 ${-11 - lift} 12-4M3 ${-17 - lift}Q14-13 18-5M10 ${-16 - lift}Q21-11 23-3`,
    null, '#a97253', 1.8);
  path(ctx, 'M-15-10C-10-18 2-14 10-9L20-6Q28-1 20 4L2-1Q-6 3-13-2Z', '#e2af88');
  path(ctx, 'M2-1L17 2', null, '#b67c58', 1.8);
  path(ctx, 'M-9-11Q-2-13 4-8', null, '#f0c7a0', 2);
  ctx.restore();
}

function foregroundLeaves(ctx, phase) {
  ctx.save();
  ctx.translate(1592 + Math.sin(phase) * 3, 912);
  ctx.rotate(Math.sin(phase) * 0.012);
  path(ctx, 'M0 22Q-27-102-20-230M-16-117Q-76-163-106-170M-20-191Q-3-232 23-255',
    null, '#294f4b', 6);
  path(ctx, 'M-19-117C-62-121-115-142-119-181C-67-181-34-157-19-117Z', '#426e60');
  path(ctx, 'M-24-159C-52-197-42-236-16-256C9-213-4-181-24-159Z', '#608573');
  path(ctx, 'M-20-74C-65-62-111-85-124-119C-73-129-31-112-20-74Z', '#325d54');
  path(ctx, 'M-8-43C22-99 54-111 82-105C73-66 44-37-8-43Z', '#27544d');
  path(ctx, 'M-19-190C-11-226 19-256 50-266C52-225 18-195-19-190Z', '#4b7865');
  path(ctx, 'M-17-116Q-65-150-106-170M-23-160Q-21-207-16-246',
    null, '#7b9b7d', 1.6);
  ctx.restore();

  ctx.save();
  ctx.translate(768, 954);
  ctx.rotate(-0.18 + Math.sin(phase + 0.9) * 0.009);
  path(ctx, 'M0 0Q8-67 58-132M14-62Q-27-103-59-109', null, '#416b5b', 4);
  path(ctx, 'M21-74C-15-67-52-82-70-116C-22-124 7-100 21-74Z', '#668c70');
  path(ctx, 'M32-95C21-130 40-165 76-178C82-142 63-112 32-95Z', '#789b79');
  path(ctx, 'M4-35C-43-25-79-46-92-74C-42-88-6-69 4-35Z', '#426e5d');
  ctx.restore();

  ctx.save();
  ctx.translate(1605, 4);
  ctx.rotate(Math.sin(phase + 0.6) * 0.008);
  path(ctx, 'M0-12Q-45 43-59 130M-27 44Q-86 49-110 78', null, '#6c8d70', 5);
  path(ctx, 'M-26 44C-67 13-98 17-120 39C-87 61-55 61-26 44Z', '#91ab84');
  path(ctx, 'M-52 97C-91 75-125 91-134 119C-94 133-66 120-52 97Z', '#84a27b');
  path(ctx, 'M-53 105C-25 79-2 76 16 88C-5 120-29 131-53 105Z', '#708f72');
  ctx.restore();
}

/**
 * Draw an original, full-frame 1600 × 900 editorial HVAC repair scene.
 * The caller owns canvas scaling, cropping, playback and reduced-motion policy.
 * Passing a fixed t produces a complete still; any time may be sought directly.
 */
export function drawHVAC(ctx, t) {
  const time = Number.isFinite(t) ? ((t % PERIOD) + PERIOD) % PERIOD : 0;
  const phase = time / PERIOD * TAU;
  const stroke = (time % 2) / 2;
  const drive = easeBetween(0.12, 0.62, stroke);
  const regrip = easeBetween(0.74, 0.97, stroke);
  const release = Math.sin(Math.PI * easeBetween(0.67, 1, stroke));
  const roll = -0.65 + 1.3 * (drive - regrip);
  const screwAngle = (Math.floor(time / 2) + drive) * Math.PI / 2;
  const sway = Math.sin(phase) * 1.8;
  const breath = Math.sin(phase + 0.4) * 1.25;
  const blink = Math.max(0, 1 - Math.abs(time - 2.84) / 0.09);

  ctx.save();
  try {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.filter = 'none';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    gardenExterior(ctx);
    wallServices(ctx);
    groundShadow(ctx, 1104, 827, 261, 38, 0.16);
    groundShadow(ctx, 942, 838, 67, 13, 0.2);
    groundShadow(ctx, 1120, 836, 65, 12, 0.19);
    toolBag(ctx);
    trousersAndBoots(ctx);
    farArm(ctx, sway, breath);
    faceAndCap(ctx, 1117 + sway, 294 + breath, 0.12 + drive * 0.022, blink);
    shirt(ctx, sway, breath);
    condenser(ctx, screwAngle);
    stabilizingHand(ctx);
    workingArm(ctx, sway, breath, phase, roll, release);
    foregroundLeaves(ctx, phase);
  } finally {
    ctx.restore();
  }
}

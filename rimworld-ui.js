(() => {
  "use strict";

  const screens = Array.from(document.querySelectorAll(".screen"));
  const toast = document.getElementById("globalToast");
  const loadingCurtain = document.getElementById("loadingCurtain");
  const mangaPages = Array.from(document.querySelectorAll(".manga-page"));
  const mangaProgress = document.getElementById("mangaProgress");
  const mangaPrev = document.getElementById("mangaPrev");
  const mangaNext = document.getElementById("mangaNext");
  let currentMangaPage = 0;
  let toastTimer = 0;
  let touchStartX = 0;
  let planetController = null;

  function updateUiScale() {
    const scale = window.innerWidth <= 600 ? 1 : Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--rim-ui-scale", String(Math.max(0.25, scale)));
  }
  updateUiScale();
  window.addEventListener("resize", updateUiScale);

  const scenarioData = {
    crashlanded: { title: "坠毁", intro: "你们三人在警报与金属撕裂声中从冷冻休眠舱醒来，勉强赶在飞船解体前进入逃生舱。片刻之后，你们降落在一个陌生的边缘世界。", faction: "新来者", people: "3 人", items: ["白银 ×800","包装生存食品 ×50","药品 ×30","零部件 ×30","栓动步枪、左轮手枪、塑钢小刀","钢铁 ×450、木材 ×300"] },
    tribe: { title: "失落部落", intro: "神明派来的钢铁血肉摧毁了你的部落。五个人成功逃脱，现在必须建立一个新家园。", faction: "新部落", people: "5 人", items: ["白银 ×200","干肉饼 ×400","草药 ×20","部落武器","木材 ×500"] },
    explorer: { title: "富有的探险家", intro: "所有人都说离开闪耀世界的家园去探索宇宙是疯了，但你仍然踏上了旅程。现在，冷冻休眠结束了。", faction: "新来者", people: "1 人", items: ["白银 ×2000","包装生存食品 ×40","闪耀世界药物 ×30","冲锋步枪","钢铁 ×450、木材 ×300"] },
    naked: { title: "赤身裸体", intro: "一次小手术的麻醉后，你却在一枚坠向遥远星球的空投舱中醒来。赤裸、孤身且毫无准备。", faction: "新来者", people: "1 人", items: ["没有物资","没有武器","没有衣物"] },
    peony: { title: "白牡丹：边缘定居者", intro: "你独自来到边缘世界，并刚刚搭起最基本的住处。黎明之前，一枚遭到未知信号干扰的逃生舱将坠落在你的领地。", faction: "新来者", people: "1 人", items: ["白银 ×400","包装生存食品 ×20","药品 ×10","简陋自动手枪","钢铁 ×180、木材 ×250","剧情物品：古锭刀（随逃生舱出现）"], note: "白牡丹不占用起始殖民者名额；她会以重伤昏迷状态作为剧情坠落者出现。" }
  };

  const storytellerData = {
    cassandra: { name: "卡桑德拉·经典", description: "卡桑德拉按照经典的紧张曲线制造事件。她会施加压力，留下喘息时间，然后再次推动故事。", art: "cassandra-art" },
    phoebe: { name: "菲比·悠闲", description: "菲比会在灾难之间留下较长的建设时间，但在较高难度下，她造成的打击仍然十分强烈。", art: "phoebe-art" },
    randy: { name: "兰迪·随机", description: "兰迪不遵循固定规则。他制造随机事件，也不在乎这些事件最终带来胜利还是绝望。", art: "randy-art" }
  };

  const siteData = {
    forest: { tile:"阿尔比昂山谷 · 42.16°N", biome:"温带森林", description:"树木繁茂、降雨适中的森林地带，适合长期定居。", movement:"2.2 天", terrain:"大型丘陵", stone:"花岗岩、大理石、石灰岩", elevation:"海拔 486 米", road:"古代沥青路", river:"小河", temperature:"年均 16℃", range:"4℃ 至 29℃", rainfall:"1,240 毫米", growing:"四季生长", forage:"100%", disease:"1.0 / 年" },
    desert: { tile:"红沙边地 · 18.04°S", biome:"干旱灌木地", description:"炎热干燥的灌木地，植被稀疏但仍能维持农耕。", movement:"1.0 天", terrain:"平原", stone:"砂岩、石灰岩", elevation:"海拔 214 米", road:"无", river:"无", temperature:"年均 28℃", range:"15℃ 至 42℃", rainfall:"310 毫米", growing:"全年生长", forage:"80%", disease:"1.2 / 年" },
    mountain: { tile:"灰脊山脉 · 35.72°N", biome:"温带森林", description:"岩层密集的山地森林，可用耕地有限，天然防御良好。", movement:"3.5 天", terrain:"山地", stone:"花岗岩、板岩、大理石", elevation:"海拔 1,368 米", road:"土路", river:"无", temperature:"年均 11℃", range:"-3℃ 至 25℃", rainfall:"930 毫米", growing:"40 / 60 天", forage:"90%", disease:"0.8 / 年" },
    tundra: { tile:"白风原 · 61.22°N", biome:"苔原", description:"寒冷而少树的高纬地带，生长期很短。", movement:"1.5 天", terrain:"小型丘陵", stone:"板岩、花岗岩", elevation:"海拔 392 米", road:"无", river:"小溪", temperature:"年均 -5℃", range:"-28℃ 至 12℃", rainfall:"420 毫米", growing:"20 / 60 天", forage:"50%", disease:"0.3 / 年" }
  };

  const planetBiomes = [
    { id:0, key:"ocean", name:"海洋", color:[0.045, 0.145, 0.215] },
    { id:1, key:"desert", name:"沙漠", color:[0.76, 0.64, 0.30] },
    { id:2, key:"temperate", name:"温带森林", color:[0.47, 0.64, 0.36] },
    { id:3, key:"tropical", name:"热带雨林", color:[0.12, 0.34, 0.18] },
    { id:4, key:"cold", name:"寒带气候", color:[0.64, 0.76, 0.79] },
    { id:5, key:"ice", name:"冰原", color:[0.39, 0.57, 0.65] }
  ];

  const fract = (value) => value - Math.floor(value);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function planetHash(point) {
    let x = fract(point[0] * 0.3183099 + 0.1) * 17;
    let y = fract(point[1] * 0.3183099 + 0.2) * 17;
    let z = fract(point[2] * 0.3183099 + 0.3) * 17;
    return fract(x * y * z * (x + y + z));
  }

  function planetNoise(point) {
    const base = point.map(Math.floor);
    const fade = point.map((value, index) => {
      const offset = fract(value);
      return offset * offset * (3 - 2 * offset);
    });
    const sample = (x, y, z) => planetHash([base[0] + x, base[1] + y, base[2] + z]);
    const lower = lerp(
      lerp(sample(0,0,0), sample(1,0,0), fade[0]),
      lerp(sample(0,1,0), sample(1,1,0), fade[0]),
      fade[1]
    );
    const upper = lerp(
      lerp(sample(0,0,1), sample(1,0,1), fade[0]),
      lerp(sample(0,1,1), sample(1,1,1), fade[0]),
      fade[1]
    );
    return lerp(lower, upper, fade[2]);
  }

  function planetFbm(point) {
    let value = 0;
    let weight = 0.5;
    let samplePoint = [...point];
    for (let octave = 0; octave < 4; octave += 1) {
      value += planetNoise(samplePoint) * weight;
      samplePoint = [samplePoint[0] * 2.03 + 1.7, samplePoint[1] * 2.03 + 2.9, samplePoint[2] * 2.03 + 1.2];
      weight *= 0.5;
    }
    return value;
  }

  function classifyPlanetCell(center) {
    const broad = planetFbm(center.map((value, index) => value * 1.72 + [2.4, 0.7, 3.8][index]));
    const detail = planetFbm(center.map((value, index) => value * 7.2 + [8.1, 4.3, 1.5][index]));
    const elevation = broad + detail * 0.13 - 0.535;
    if (elevation < 0) return planetBiomes[0];
    const latitude = Math.abs(center[1]);
    const moisture = planetFbm(center.map((value, index) => value * 3.5 + [9.7, 2.1, 6.3][index]));
    if (latitude > 0.86) return planetBiomes[5];
    if (latitude > 0.62) return planetBiomes[4];
    if (latitude < 0.38 && moisture > 0.52) return planetBiomes[3];
    if (latitude < 0.48 && moisture < 0.47) return planetBiomes[1];
    return planetBiomes[2];
  }

  function buildGeodesicCells(subdivisions = 3) {
    const normalize = (vector) => {
      const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
      return [vector[0] / length, vector[1] / length, vector[2] / length];
    };
    const cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    let vertices = [
      [-1,goldenRatio,0],[1,goldenRatio,0],[-1,-goldenRatio,0],[1,-goldenRatio,0],
      [0,-1,goldenRatio],[0,1,goldenRatio],[0,-1,-goldenRatio],[0,1,-goldenRatio],
      [goldenRatio,0,-1],[goldenRatio,0,1],[-goldenRatio,0,-1],[-goldenRatio,0,1]
    ].map(normalize);
    let faces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];

    for (let level = 0; level < subdivisions; level += 1) {
      const midpointCache = new Map();
      const midpointIndex = (first, second) => {
        const low = Math.min(first, second);
        const high = Math.max(first, second);
        const key = `${low}:${high}`;
        if (midpointCache.has(key)) return midpointCache.get(key);
        const midpoint = normalize([
          vertices[first][0] + vertices[second][0],
          vertices[first][1] + vertices[second][1],
          vertices[first][2] + vertices[second][2]
        ]);
        const index = vertices.length;
        vertices.push(midpoint);
        midpointCache.set(key, index);
        return index;
      };
      const nextFaces = [];
      faces.forEach(([a, b, c]) => {
        const ab = midpointIndex(a, b);
        const bc = midpointIndex(b, c);
        const ca = midpointIndex(c, a);
        nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      });
      faces = nextFaces;
    }

    const faceCenters = faces.map(([a, b, c]) => normalize([
      vertices[a][0] + vertices[b][0] + vertices[c][0],
      vertices[a][1] + vertices[b][1] + vertices[c][1],
      vertices[a][2] + vertices[b][2] + vertices[c][2]
    ]));
    const adjacentFaces = vertices.map(() => []);
    faces.forEach((face, faceIndex) => face.forEach((vertexIndex) => adjacentFaces[vertexIndex].push(faceIndex)));

    const cells = vertices.map((center, index) => {
      const referenceAxis = Math.abs(center[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const tangentX = normalize(cross(referenceAxis, center));
      const tangentY = normalize(cross(center, tangentX));
      const corners = adjacentFaces[index]
        .map((faceIndex) => faceCenters[faceIndex])
        .sort((first, second) => {
          const firstAngle = Math.atan2(dot(first, tangentY), dot(first, tangentX));
          const secondAngle = Math.atan2(dot(second, tangentY), dot(second, tangentX));
          return firstAngle - secondAngle;
        });
      const biome = classifyPlanetCell(center);
      return {
        id: index + 1,
        key: `tile-${String(index + 1).padStart(4, "0")}`,
        center,
        corners,
        sides: corners.length,
        biomeId: biome.id,
        biomeKey: biome.key,
        biomeName: biome.name,
        lat: Math.asin(Math.max(-1, Math.min(1, center[1]))) * 180 / Math.PI,
        lon: Math.atan2(center[0], center[2]) * 180 / Math.PI
      };
    });

    const surfacePositions = [];
    const surfaceSides = [];
    const wirePositions = [];
    const wireSides = [];
    cells.forEach((cell) => {
      cell.corners.forEach((corner, cornerIndex) => {
        const nextCorner = cell.corners[(cornerIndex + 1) % cell.corners.length];
        surfacePositions.push(...cell.center, ...corner, ...nextCorner);
        surfaceSides.push(cell.sides, cell.sides, cell.sides);
      });
    });
    [...cells.filter((cell) => cell.sides === 6), ...cells.filter((cell) => cell.sides === 5)].forEach((cell) => {
      cell.corners.forEach((corner, cornerIndex) => {
        const nextCorner = cell.corners[(cornerIndex + 1) % cell.corners.length];
        wirePositions.push(...corner, ...nextCorner);
        wireSides.push(cell.sides, cell.sides);
      });
    });

    return { cells, surfacePositions, surfaceSides, wirePositions, wireSides };
  }

  function createPlanetRenderer(options) {
    const { container, canvas, siteButtons, marker, onSurfacePick } = options;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, depth: true });
    const fallbackPositions = [[27,42],[78,31],[51,71],[70,63],[38,18],[22,68],[84,55],[53,37]];
    let yaw = 0;
    let pitch = 0.12;
    let distance = 3.55;
    let active = false;
    let selectedPoint = null;

    function fallback() {
      container.classList.add("is-fallback");
      canvas.hidden = true;
      document.getElementById("globeFallback").hidden = false;
      siteButtons.forEach((button, index) => {
        button.style.display = "grid";
        button.style.left = `${fallbackPositions[index][0]}%`;
        button.style.top = `${fallbackPositions[index][1]}%`;
      });
      return {
        activate() {},
        setSelection(lat, lon) {
          const nearest = siteButtons.reduce((best, button) => {
            const score = Math.abs(Number(button.dataset.lat) - lat) + Math.abs(Number(button.dataset.lon) - lon);
            return !best || score < best.score ? { button, score } : best;
          }, null).button;
          marker.style.display = "block";
          marker.style.left = nearest.style.left;
          marker.style.top = nearest.style.top;
        },
        focusLocation() {},
        getCell(lat, lon) {
          return { id: 1, key: "tile-0001", sides: 6, lat, lon, biomeId:2, biomeKey:"temperate", biomeName:"温带森林" };
        },
        getStats() {
          return { cells: 0, pentagons: 0, hexagons: 0 };
        }
      };
    }

    if (!gl) return fallback();

    const vertexSource = `
      attribute vec3 aPosition;
      attribute float aCellSides;
      attribute float aCellBiome;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uAspect;
      uniform float uDistance;
      uniform float uRadius;
      varying float vCellSides;
      varying float vCellBiome;
      void main() {
        float cy = cos(uYaw), sy = sin(uYaw);
        float cp = cos(uPitch), sp = sin(uPitch);
        vec3 local = aPosition * uRadius;
        vec3 ry = vec3(cy * local.x + sy * local.z, local.y, -sy * local.x + cy * local.z);
        vec3 rotated = vec3(ry.x, cp * ry.y - sp * ry.z, sp * ry.y + cp * ry.z);
        vec3 view = rotated + vec3(0.0, 0.0, -uDistance);
        float focal = 3.1715948;
        float near = 0.1;
        float far = 20.0;
        float clipZ = ((far + near) / (near - far)) * view.z + ((2.0 * far * near) / (near - far));
        gl_Position = vec4(view.x * focal / uAspect, view.y * focal, clipZ, -view.z);
        vCellSides = aCellSides;
        vCellBiome = aCellBiome;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform float uWire;
      uniform float uSelected;
      varying float vCellSides;
      varying float vCellBiome;
      void main() {
        if (uWire > 0.5) {
          vec3 edgeColor = uSelected > 0.5 ? vec3(1.0, 0.76, 0.20) : vCellSides < 5.5 ? vec3(0.88, 0.68, 0.31) : vec3(0.66, 0.70, 0.66);
          float edgeAlpha = uSelected > 0.5 ? 0.96 : vCellSides < 5.5 ? 0.34 : 0.16;
          gl_FragColor = vec4(edgeColor, edgeAlpha);
          return;
        }
        vec3 color = vec3(${planetBiomes[0].color.join(", ")});
        if (vCellBiome > 4.5) color = vec3(${planetBiomes[5].color.join(", ")});
        else if (vCellBiome > 3.5) color = vec3(${planetBiomes[4].color.join(", ")});
        else if (vCellBiome > 2.5) color = vec3(${planetBiomes[3].color.join(", ")});
        else if (vCellBiome > 1.5) color = vec3(${planetBiomes[2].color.join(", ")});
        else if (vCellBiome > 0.5) color = vec3(${planetBiomes[1].color.join(", ")});
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("WebGL shader compilation failed");
      }
      return shader;
    }

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("WebGL program link failed");
    } catch (error) {
      return fallback();
    }

    const geodesic = buildGeodesicCells(3);
    const { cells, surfacePositions, surfaceSides, wirePositions, wireSides } = geodesic;
    const forcedSiteBiomes = { forest:2, desert:1, mountain:2, tundra:4 };
    siteButtons.forEach((button) => {
      const biome = planetBiomes[forcedSiteBiomes[button.dataset.site] ?? 2];
      const cell = getCell(Number(button.dataset.lat), Number(button.dataset.lon));
      cell.biomeId = biome.id;
      cell.biomeKey = biome.key;
      cell.biomeName = biome.name;
    });
    const surfaceBiomes = [];
    cells.forEach((cell) => cell.corners.forEach(() => surfaceBiomes.push(cell.biomeId, cell.biomeId, cell.biomeId)));
    const biomeCounts = Object.fromEntries(planetBiomes.map((biome) => [biome.key, cells.filter((cell) => cell.biomeId === biome.id).length]));
    container.dataset.cellCount = String(cells.length);
    container.dataset.pentagonCount = String(cells.filter((cell) => cell.sides === 5).length);
    container.dataset.hexagonCount = String(cells.filter((cell) => cell.sides === 6).length);
    container.dataset.biomeCounts = JSON.stringify(biomeCounts);

    function createBuffer(data) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return buffer;
    }
    const surfacePositionBuffer = createBuffer(surfacePositions);
    const surfaceSidesBuffer = createBuffer(surfaceSides);
    const surfaceBiomeBuffer = createBuffer(surfaceBiomes);
    const wirePositionBuffer = createBuffer(wirePositions);
    const wireSidesBuffer = createBuffer(wireSides);
    const selectedWirePositionBuffer = createBuffer([]);
    const selectedWireSidesBuffer = createBuffer([]);
    let selectedWireVertexCount = 0;
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const cellSidesLocation = gl.getAttribLocation(program, "aCellSides");
    const cellBiomeLocation = gl.getAttribLocation(program, "aCellBiome");
    const uniforms = {
      yaw: gl.getUniformLocation(program, "uYaw"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      aspect: gl.getUniformLocation(program, "uAspect"),
      distance: gl.getUniformLocation(program, "uDistance"),
      radius: gl.getUniformLocation(program, "uRadius"),
      wire: gl.getUniformLocation(program, "uWire"),
      selected: gl.getUniformLocation(program, "uSelected")
    };

    function updateSelectedWireGeometry(cell) {
      const positions = [];
      const sides = [];
      cell.corners.forEach((corner, cornerIndex) => {
        positions.push(...corner, ...cell.corners[(cornerIndex + 1) % cell.corners.length]);
        sides.push(cell.sides, cell.sides);
      });
      selectedWireVertexCount = positions.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, selectedWirePositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, selectedWireSidesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sides), gl.DYNAMIC_DRAW);
    }

    function pointFromCoordinates(lat, lon) {
      const phi = lat * Math.PI / 180;
      const theta = lon * Math.PI / 180;
      return [Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta)];
    }

    function nearestCellFromPoint(point) {
      let nearest = cells[0];
      let nearestScore = -Infinity;
      cells.forEach((cell) => {
        const score = point[0] * cell.center[0] + point[1] * cell.center[1] + point[2] * cell.center[2];
        if (score > nearestScore) {
          nearest = cell;
          nearestScore = score;
        }
      });
      return nearest;
    }

    function getCell(lat, lon) {
      return nearestCellFromPoint(pointFromCoordinates(lat, lon));
    }

    function rotatePoint(point) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x = cy * point[0] + sy * point[2];
      const z = -sy * point[0] + cy * point[2];
      return [x, cp * point[1] - sp * z, sp * point[1] + cp * z];
    }

    function projectCoordinates(lat, lon) {
      const point = rotatePoint(pointFromCoordinates(lat, lon));
      if (point[2] <= 1 / distance + 0.012) return null;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const aspect = width / Math.max(1, height);
      const focal = 3.1715948;
      const depth = distance - point[2];
      const ndcX = point[0] * focal / aspect / depth;
      const ndcY = point[1] * focal / depth;
      const screenX = (ndcX * 0.5 + 0.5) * width;
      const screenY = (0.5 - ndcY * 0.5) * height;
      if (screenX < 16 || screenX > width - 16 || screenY < 16 || screenY > height - 16) return null;
      return [screenX, screenY, point[2]];
    }

    function updateOverlays() {
      siteButtons.forEach((button) => {
        const projected = projectCoordinates(Number(button.dataset.lat), Number(button.dataset.lon));
        button.style.display = projected ? "grid" : "none";
        if (!projected) return;
        button.style.left = `${projected[0]}px`;
        button.style.top = `${projected[1]}px`;
        button.style.opacity = String(Math.min(1, 0.45 + projected[2]));
      });
      if (!selectedPoint) return;
      const projected = projectCoordinates(selectedPoint.lat, selectedPoint.lon);
      marker.style.display = projected ? "block" : "none";
      if (!projected) return;
      marker.style.left = `${projected[0]}px`;
      marker.style.top = `${projected[1]}px`;
    }

    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return false;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.35 : 1.7);
      const renderWidth = Math.max(1, Math.round(width * pixelRatio));
      const renderHeight = Math.max(1, Math.round(height * pixelRatio));
      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      return true;
    }

    function render() {
      if (!active || !resize()) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniform1f(uniforms.yaw, yaw);
      gl.uniform1f(uniforms.pitch, pitch);
      gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
      gl.uniform1f(uniforms.distance, distance);
      gl.uniform1f(uniforms.selected, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, surfacePositionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, surfaceSidesBuffer);
      gl.enableVertexAttribArray(cellSidesLocation);
      gl.vertexAttribPointer(cellSidesLocation, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBiomeBuffer);
      gl.enableVertexAttribArray(cellBiomeLocation);
      gl.vertexAttribPointer(cellBiomeLocation, 1, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.radius, 1);
      gl.uniform1f(uniforms.wire, 0);
      gl.drawArrays(gl.TRIANGLES, 0, surfacePositions.length / 3);

      gl.bindBuffer(gl.ARRAY_BUFFER, wirePositionBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, wireSidesBuffer);
      gl.vertexAttribPointer(cellSidesLocation, 1, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(cellBiomeLocation);
      gl.vertexAttrib1f(cellBiomeLocation, 0);
      gl.uniform1f(uniforms.radius, 1.0025);
      gl.uniform1f(uniforms.wire, 1);
      gl.drawArrays(gl.LINES, 0, wirePositions.length / 3);

      if (selectedWireVertexCount) {
        gl.bindBuffer(gl.ARRAY_BUFFER, selectedWirePositionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, selectedWireSidesBuffer);
        gl.vertexAttribPointer(cellSidesLocation, 1, gl.FLOAT, false, 0, 0);
        gl.uniform1f(uniforms.radius, 1.007);
        gl.uniform1f(uniforms.selected, 1);
        gl.drawArrays(gl.LINES, 0, selectedWireVertexCount);
      }
      updateOverlays();
    }

    function surfacePointFromEvent(event) {
      const bounds = canvas.getBoundingClientRect();
      const width = bounds.width;
      const height = bounds.height;
      const ndcX = ((event.clientX - bounds.left) / width) * 2 - 1;
      const ndcY = 1 - ((event.clientY - bounds.top) / height) * 2;
      const tangent = Math.tan(17.5 * Math.PI / 180);
      const direction = [ndcX * (width / height) * tangent, ndcY * tangent, -1];
      const directionLength = Math.hypot(...direction);
      direction[0] /= directionLength;
      direction[1] /= directionLength;
      direction[2] /= directionLength;
      const b = distance * direction[2];
      const discriminant = b * b - (distance * distance - 1);
      if (discriminant < 0) return null;
      const t = -b - Math.sqrt(discriminant);
      const world = [direction[0] * t, direction[1] * t, distance + direction[2] * t];
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const rx = world[0];
      const ry = cp * world[1] + sp * world[2];
      const rz = -sp * world[1] + cp * world[2];
      const local = [cy * rx - sy * rz, ry, sy * rx + cy * rz];
      return nearestCellFromPoint(local);
    }

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let dragged = false;
    canvas.addEventListener("pointerdown", (event) => {
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      dragged = false;
      canvas.setPointerCapture(pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5) dragged = true;
      yaw += dx * 0.008;
      pitch = Math.max(-1.22, Math.min(1.22, pitch + dy * 0.008));
      lastX = event.clientX;
      lastY = event.clientY;
      render();
    });
    canvas.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      canvas.releasePointerCapture(pointerId);
      pointerId = null;
      if (dragged) return;
      const cell = surfacePointFromEvent(event);
      if (cell) onSurfacePick(cell.lat, cell.lon, cell);
    });
    canvas.addEventListener("pointercancel", () => { pointerId = null; });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      distance = Math.max(3.38, Math.min(5, distance + event.deltaY * 0.002));
      render();
    }, { passive: false });
    canvas.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","-","="];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") yaw -= 0.12;
      if (event.key === "ArrowRight") yaw += 0.12;
      if (event.key === "ArrowUp") pitch = Math.max(-1.22, pitch - 0.1);
      if (event.key === "ArrowDown") pitch = Math.min(1.22, pitch + 0.1);
      if (event.key === "+" || event.key === "=") distance = Math.max(3.38, distance - 0.16);
      if (event.key === "-") distance = Math.min(5, distance + 0.16);
      render();
    });
    window.addEventListener("resize", render);
    if (window.ResizeObserver) new ResizeObserver(render).observe(container);

    return {
      activate() {
        active = true;
        render();
      },
      setSelection(lat, lon, cellId) {
        const cell = cellId ? cells.find((item) => item.id === cellId) || getCell(lat, lon) : getCell(lat, lon);
        selectedPoint = { lat: cell.lat, lon: cell.lon, cellId: cell.id };
        updateSelectedWireGeometry(cell);
        render();
        return cell;
      },
      focusLocation(lat, lon) {
        const cell = getCell(lat, lon);
        yaw = -cell.lon * Math.PI / 180;
        pitch = Math.max(-1.18, Math.min(1.18, cell.lat * Math.PI / 180));
        render();
        return cell;
      },
      getCell,
      getStats() {
        return {
          cells: cells.length,
          pentagons: cells.filter((cell) => cell.sides === 5).length,
          hexagons: cells.filter((cell) => cell.sides === 6).length
        };
      }
    };
  }

  const candidateData = {
    lin: { name:"林", job:"空间站工程师", summary:"新来者阵营成员，女性，生理年龄 27 岁。", childhood:"轨道贫民", adulthood:"空间站工程师", incapable:"无", traits:"勤劳<br>坚韧", health:"全身：健康", relations:"没有关系", skills:[6,3,9,5,4,5,2,6,7,1,4,3] },
    mira: { name:"米拉", job:"乡村医生", summary:"新来者阵营成员，女性，生理年龄 34 岁。", childhood:"农场孩子", adulthood:"乡村医生", incapable:"暴力", traits:"乐观<br>善良", health:"左眼：视力减弱", relations:"没有关系", skills:[1,1,4,2,6,5,4,2,3,10,7,5] },
    grey: { name:"格雷", job:"佣兵", summary:"新来者阵营成员，男性，生理年龄 41 岁。", childhood:"街头顽童", adulthood:"佣兵", incapable:"照料", traits:"冷静<br>好斗", health:"躯干：旧枪伤", relations:"没有关系", skills:[11,9,3,2,2,1,1,5,6,2,4,1] },
    yan: { name:"燕", job:"作物学家", summary:"新来者阵营成员，女性，生理年龄 30 岁。", childhood:"温室学生", adulthood:"作物学家", incapable:"采矿", traits:"神经质<br>快步", health:"全身：健康", relations:"没有关系", skills:[4,2,5,1,4,12,6,4,2,3,3,7] },
    sol: { name:"索尔", job:"矿工", summary:"新来者阵营成员，男性，生理年龄 38 岁。", childhood:"矿镇少年", adulthood:"深层矿工", incapable:"艺术", traits:"地下居民<br>坚韧", health:"右腿：旧伤", relations:"没有关系", skills:[4,6,5,12,3,2,1,7,4,2,2,1] },
    nora: { name:"诺拉", job:"流浪学者", summary:"新来者阵营成员，女性，生理年龄 45 岁。", childhood:"书库助手", adulthood:"流浪学者", incapable:"搬运", traits:"过目不忘<br>悲观", health:"全身：健康", relations:"没有关系", skills:[2,1,2,1,4,3,2,4,6,5,8,13] },
    axel: { name:"阿克塞尔", job:"商队护卫", summary:"新来者阵营成员，男性，生理年龄 29 岁。", childhood:"商队孩子", adulthood:"商队护卫", incapable:"研究", traits:"漂亮<br>谨慎射手", health:"全身：健康", relations:"没有关系", skills:[10,5,4,2,2,3,6,5,3,2,9,0] },
    mei: { name:"梅", job:"厨师", summary:"新来者阵营成员，女性，生理年龄 25 岁。", childhood:"餐馆学徒", adulthood:"厨师", incapable:"无", traits:"嗜睡<br>美食家", health:"全身：健康", relations:"没有关系", skills:[3,2,3,1,12,5,2,6,4,2,5,3] }
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-show"), 2200);
  }

  function showScreen(id) {
    screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
    if (id === "screen-landing") window.requestAnimationFrame(() => planetController?.activate());
  }

  function withLoading(message, callback) {
    loadingCurtain.querySelector("p").textContent = message;
    loadingCurtain.classList.add("is-show");
    window.setTimeout(() => {
      callback();
      window.setTimeout(() => loadingCurtain.classList.remove("is-show"), 420);
    }, 720);
  }

  document.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.demo));
  });

  document.getElementById("startGame").addEventListener("click", () => {
    withLoading("正在创建新的边缘世界……", () => {
      currentMangaPage = 0;
      showMangaPage(0);
      showScreen("screen-manga");
    });
  });

  mangaPages.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `前往漫画第 ${index + 1} 页`);
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      showMangaPage(index);
    });
    mangaProgress.appendChild(dot);
  });

  function showMangaPage(index) {
    currentMangaPage = Math.max(0, Math.min(mangaPages.length - 1, index));
    mangaPages.forEach((page, pageIndex) => page.classList.toggle("is-current", pageIndex === currentMangaPage));
    Array.from(mangaProgress.children).forEach((dot, dotIndex) => dot.classList.toggle("is-current", dotIndex === currentMangaPage));
    mangaPrev.disabled = currentMangaPage === 0;
    mangaNext.disabled = currentMangaPage === mangaPages.length - 1;
  }

  function nextManga() {
    if (currentMangaPage < mangaPages.length - 1) showMangaPage(currentMangaPage + 1);
  }

  mangaPrev.addEventListener("click", (event) => {
    event.stopPropagation();
    showMangaPage(currentMangaPage - 1);
  });
  mangaNext.addEventListener("click", (event) => {
    event.stopPropagation();
    nextManga();
  });
  document.getElementById("mangaViewport").addEventListener("click", (event) => {
    if (!event.target.closest("button") && currentMangaPage < mangaPages.length - 1) nextManga();
  });
  document.getElementById("mangaViewport").addEventListener("pointerdown", (event) => {
    touchStartX = event.clientX;
  });
  document.getElementById("mangaViewport").addEventListener("pointerup", (event) => {
    const distance = event.clientX - touchStartX;
    if (Math.abs(distance) < 55) return;
    if (distance < 0) nextManga();
    else showMangaPage(currentMangaPage - 1);
  });

  function continueToScenario() {
    withLoading("正在读取剧本……", () => showScreen("screen-scenario"));
  }
  document.getElementById("enterColony").addEventListener("click", continueToScenario);
  document.getElementById("skipManga").addEventListener("click", continueToScenario);

  let selectedScenario = "peony";
  function renderScenario() {
    const data = scenarioData[selectedScenario];
    document.getElementById("scenarioDetail").innerHTML = `<h3>${data.title}</h3><p>${data.intro}</p><p>你的派系将是“${data.faction}”。<br>以 ${data.people} 开始。</p><p>初始物资：</p><ul>${data.items.map((item) => `<li>${item}</li>`).join("")}</ul>${data.note ? `<p class="scenario-note">${data.note}</p>` : ""}`;
  }
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedScenario = button.dataset.scenario;
      document.querySelectorAll("[data-scenario]").forEach((item) => item.classList.toggle("is-selected", item === button));
      renderScenario();
    });
  });
  document.getElementById("scenarioNext").addEventListener("click", () => showScreen("screen-storyteller"));

  let selectedStoryteller = "cassandra";
  function renderStoryteller() {
    const data = storytellerData[selectedStoryteller];
    document.getElementById("storytellerName").textContent = data.name;
    document.getElementById("storytellerDescription").textContent = data.description;
    const portrait = document.getElementById("storytellerPortrait");
    portrait.className = `storyteller-portrait ${data.art}`;
  }
  document.querySelectorAll("[data-storyteller]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedStoryteller = button.dataset.storyteller;
      document.querySelectorAll("[data-storyteller]").forEach((item) => item.classList.toggle("is-selected", item === button));
      renderStoryteller();
    });
  });
  document.getElementById("storytellerNext").addEventListener("click", () => showScreen("screen-world"));

  const seedWords = ["white peony", "horax", "moelotl", "ancient saber", "rim dawn", "escape pod"];
  document.getElementById("randomSeed").addEventListener("click", () => {
    document.getElementById("worldSeed").value = seedWords[Math.floor(Math.random() * seedWords.length)];
  });
  document.getElementById("resetWorld").addEventListener("click", () => {
    document.getElementById("worldSeed").value = "white peony";
    document.getElementById("globeCoverage").value = "50%";
    document.querySelectorAll("#worldSettings input[type='range']").forEach((range) => { range.value = "2"; });
    document.querySelectorAll("#factionList article").forEach((article) => article.classList.remove("is-disabled"));
  });
  document.getElementById("factionList").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    button.closest("article").classList.toggle("is-disabled");
  });
  document.getElementById("resetFactions").addEventListener("click", () => {
    document.querySelectorAll("#factionList article").forEach((article) => article.classList.remove("is-disabled"));
  });
  document.getElementById("addFaction").addEventListener("click", () => showToast("可添加的原版派系已全部列出。"));
  document.getElementById("generateWorld").addEventListener("click", () => {
    withLoading("正在生成世界……", () => showScreen("screen-landing"));
  });

  let selectedSite = "";
  const siteInfo = document.getElementById("siteInfo");
  const landingMarker = document.getElementById("landingMarker");
  const worldGlobe = document.getElementById("worldGlobe");
  const worldGlobeCanvas = document.getElementById("worldGlobeCanvas");
  const worldSiteButtons = Array.from(document.querySelectorAll(".world-site"));

  function coordinateLabel(value, positive, negative) {
    return `${Math.abs(value).toFixed(2)}°${value >= 0 ? positive : negative}`;
  }

  function locationNoise(lat, lon, offset = 0) {
    const value = Math.sin(lat * 12.9898 + lon * 78.233 + offset * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  function generatedSiteData(lat, lon, cell) {
    const absoluteLatitude = Math.abs(lat);
    const moisture = locationNoise(lat, lon, 1);
    const roughness = locationNoise(lat, lon, 2);
    const roadNoise = locationNoise(lat, lon, 3);
    const riverNoise = locationNoise(lat, lon, 5);
    const biome = cell.biomeName;
    const terrain = roughness > 0.83 ? "山地" : roughness > 0.57 ? "大型丘陵" : roughness > 0.3 ? "小型丘陵" : "平原";
    const road = roadNoise > 0.9 ? "古代沥青路" : roadNoise > 0.78 ? "土路" : "无";
    const river = riverNoise > 0.92 ? "大河" : riverNoise > 0.78 ? "小河" : "无";
    const temperature = Math.round(30 - absoluteLatitude * 0.53 + (moisture - 0.5) * 6);
    const lowTemperature = temperature - Math.round(8 + absoluteLatitude * 0.12);
    const highTemperature = temperature + Math.round(9 + (1 - moisture) * 5);
    const growingDays = temperature > 18 ? "全年生长" : temperature > 7 ? `${Math.max(20, Math.round(60 - absoluteLatitude * 0.55))} / 60 天` : temperature > -8 ? "20 / 60 天" : "无法生长";
    const stoneSets = ["花岗岩、石灰岩", "砂岩、板岩", "大理石、花岗岩", "板岩、大理石、石灰岩"];
    const descriptionByBiome = {
      "温带森林":"树木与野生动物丰富，温度适中，是较稳妥的定居地。",
      "寒带气候":"寒冷、少树且土壤贫瘠，生长期较短。",
      "冰原":"几乎没有植被的极寒地带，长期生存十分困难。",
      "沙漠":"极端干燥、植被稀少，温度昼夜变化明显。",
      "热带雨林":"全年温暖多雨，植被浓密且疾病频繁。",
      "海洋":"被深海覆盖的地域，无法作为殖民地着陆点。"
    };
    const movementByTerrain = { "平原":"1.0 天", "小型丘陵":"1.5 天", "大型丘陵":"2.2 天", "山地":"3.5 天" };
    if (cell.biomeKey === "ocean") {
      return {
        tile:`第 ${cell.id} 地块 · ${coordinateLabel(lat, "N", "S")} ${coordinateLabel(lon, "E", "W")}`,
        region:`${cell.key} · ${cell.sides === 5 ? "五边形" : "六边形"}`,
        biome,
        description:descriptionByBiome[biome],
        movement:"不可通行",
        terrain:"深海",
        stone:"—",
        elevation:"海平面以下",
        road:"无",
        river:"无",
        temperature:`年均 ${temperature}℃`,
        range:`${lowTemperature}℃ 至 ${highTemperature}℃`,
        rainfall:"—",
        growing:"无法生长",
        forage:"0%",
        disease:"—",
        landingAllowed:false
      };
    }
    return {
      tile:`第 ${cell.id} 地块 · ${coordinateLabel(lat, "N", "S")} ${coordinateLabel(lon, "E", "W")}`,
      region:`${cell.key} · ${cell.sides === 5 ? "五边形" : "六边形"}`,
      biome,
      description:descriptionByBiome[biome],
      movement:movementByTerrain[terrain],
      terrain,
      stone:stoneSets[Math.floor(locationNoise(lat, lon, 6) * stoneSets.length)],
      elevation:`海拔 ${Math.round(80 + roughness * 1480)} 米`,
      road,
      river,
      temperature:`年均 ${temperature}℃`,
      range:`${lowTemperature}℃ 至 ${highTemperature}℃`,
      rainfall:`${Math.round(180 + moisture * 1820)} 毫米`,
      growing:growingDays,
      forage:`${Math.round(45 + moisture * 55)}%`,
      disease:`${biome === "热带雨林" ? "2.4" : biome === "冰原" || biome === "寒带气候" ? "0.3" : "1.0"} / 年`,
      landingAllowed:true
    };
  }

  function renderSiteInfo(data) {
    siteInfo.innerHTML = `<h3>着陆点信息</h3><p class="site-biome-copy">${data.description}</p><dl><dt>地块</dt><dd>${data.tile}</dd><dt>地域单元</dt><dd>${data.region}</dd><dt>生态区</dt><dd>${data.biome}</dd><dt>移动难度</dt><dd>${data.movement}</dd><dt>地形</dt><dd>${data.terrain}</dd><dt>石材类型</dt><dd>${data.stone}</dd><dt>海拔</dt><dd>${data.elevation}</dd><dt>道路</dt><dd>${data.road}</dd><dt>河流</dt><dd>${data.river}</dd><dt>平均温度</dt><dd>${data.temperature}</dd><dt>温度范围</dt><dd>${data.range}</dd><dt>降雨量</dt><dd>${data.rainfall}</dd><dt>生长周期</dt><dd>${data.growing}</dd><dt>觅食性</dt><dd>${data.forage}</dd><dt>疾病频率</dt><dd>${data.disease}</dd></dl>`;
    document.getElementById("landingNext").disabled = data.landingAllowed === false;
  }

  function chooseSite(button) {
    selectedSite = button.dataset.site;
    const data = siteData[selectedSite];
    const lat = Number(button.dataset.lat);
    const lon = Number(button.dataset.lon);
    const cell = planetController.getCell(lat, lon);
    planetController.setSelection(cell.lat, cell.lon, cell.id);
    renderSiteInfo({
      ...data,
      tile:`${data.tile.split(" · ")[0]} · 第 ${cell.id} 地块 · ${coordinateLabel(cell.lat, "N", "S")} ${coordinateLabel(cell.lon, "E", "W")}`,
      region:`${cell.key} · ${cell.sides === 5 ? "五边形" : "六边形"}`,
      biome:cell.biomeName,
      landingAllowed:true
    });
  }

  function chooseSurfaceSite(lat, lon, selectedCell) {
    selectedSite = "surface";
    const cell = selectedCell || planetController.getCell(lat, lon);
    planetController.setSelection(cell.lat, cell.lon, cell.id);
    renderSiteInfo(generatedSiteData(cell.lat, cell.lon, cell));
  }

  planetController = createPlanetRenderer({
    container: worldGlobe,
    canvas: worldGlobeCanvas,
    siteButtons: worldSiteButtons,
    marker: landingMarker,
    onSurfacePick: chooseSurfaceSite
  });

  worldSiteButtons.forEach((button) => button.addEventListener("click", () => chooseSite(button)));
  document.getElementById("randomSite").addEventListener("click", () => {
    let cell;
    let attempts = 0;
    do {
      const lat = -62 + Math.random() * 124;
      const lon = -180 + Math.random() * 360;
      cell = planetController.getCell(lat, lon);
      attempts += 1;
    } while (cell.biomeKey === "ocean" && attempts < 80);
    planetController.focusLocation(cell.lat, cell.lon);
    chooseSurfaceSite(cell.lat, cell.lon, cell);
  });
  document.getElementById("landingNext").addEventListener("click", () => showScreen("screen-colonists"));

  const skillNames = ["射击","格斗","建造","采矿","烹饪","种植","驯兽","制作","艺术","医疗","社交","智识"];
  const passionData = {
    lin: { 2:2, 7:1, 11:1 }, mira: { 4:1, 9:2, 10:1 }, grey: { 0:2, 1:1, 7:1 }, yan: { 5:2, 6:1, 11:1 },
    sol: { 1:1, 3:2, 7:1 }, nora: { 8:1, 10:1, 11:2 }, axel: { 0:2, 6:1, 10:1 }, mei: { 4:2, 5:1, 10:1 }
  };
  let selectedCandidate = "lin";
  function renderCandidate() {
    const data = candidateData[selectedCandidate];
    document.getElementById("candidateFirstName").value = data.name;
    document.getElementById("candidateNickName").value = data.name;
    document.getElementById("candidateLastName").value = "";
    document.getElementById("candidateSummary").textContent = data.summary;
    document.getElementById("backstoryData").innerHTML = `<dt>童年</dt><dd>${data.childhood}</dd><dt>成年</dt><dd>${data.adulthood}</dd>`;
    document.getElementById("incapableData").textContent = data.incapable;
    document.getElementById("traitData").innerHTML = data.traits;
    document.getElementById("healthData").textContent = data.health;
    document.getElementById("relationData").textContent = data.relations;
    document.getElementById("skillsData").innerHTML = data.skills.map((level,index) => {
      const passion = passionData[selectedCandidate][index] || 0;
      const passionClass = passion === 2 ? "major" : passion === 1 ? "minor" : "none";
      const passionLabel = passion === 2 ? "强烈兴趣" : passion === 1 ? "兴趣" : "无兴趣";
      return `<div class="skill-row"><span>${skillNames[index]}</span><b>${level}</b><em class="passion ${passionClass}" title="${passionLabel}" aria-label="${passionLabel}"></em><i style="width:${Math.min(100, level / 15 * 100)}%"></i></div>`;
    }).join("");
    document.getElementById("teamSkills").innerHTML = data.skills.map((level,index) => `<span>${skillNames[index]} <b>${level}</b></span>`).join("");
  }
  document.querySelectorAll("[data-candidate]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCandidate = button.dataset.candidate;
      document.querySelectorAll("[data-candidate]").forEach((item) => item.classList.toggle("is-selected", item === button));
      renderCandidate();
    });
  });
  document.getElementById("randomizePawn").addEventListener("click", () => {
    const candidates = Array.from(document.querySelectorAll("[data-candidate]"));
    candidates[Math.floor(Math.random() * candidates.length)].click();
  });
  document.querySelectorAll("[data-setup-back]").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.setupBack));
  });
  document.getElementById("startColony").addEventListener("click", () => {
    withLoading("正在确认开局设置……", () => {
      showToast("开局设置完成。第一天的剧情将由角色卡正文接管。");
    });
  });

  document.addEventListener("keydown", (event) => {
    const mangaActive = document.getElementById("screen-manga").classList.contains("is-active");
    if (mangaActive && event.key === "ArrowRight") nextManga();
    if (mangaActive && event.key === "ArrowLeft") showMangaPage(currentMangaPage - 1);
    if (mangaActive && event.key === "Enter" && currentMangaPage === mangaPages.length - 1) continueToScenario();
  });

  showMangaPage(0);
  renderScenario();
  renderStoryteller();
  renderCandidate();
})();

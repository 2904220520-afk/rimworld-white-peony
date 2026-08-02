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
    peony: {
      title: "白牡丹：边缘定居者",
      intro: "你独自来到边缘世界，并刚刚搭起最基本的住处。黎明之前，一枚遭到未知信号干扰的逃生舱将坠落在你的领地。",
      faction: "新来者",
      people: "1 人",
      items: ["白银 ×400","包装生存食品 ×20","医药 ×10","简陋自动手枪","钢铁 ×180、木材 ×250","剧情物品：古锭刀（随逃生舱出现）"],
      inventory: { "白银":400, "包装生存食品":20, "医药":10, "钢铁":180, "木材":250 },
      facilities: ["炉灶", "屠宰台", "石块切割台", "缝制台"],
      equipment: ["简陋自动手枪", "基础衣物"],
      note: "白牡丹不占用起始殖民者名额；她会以重伤昏迷状态作为剧情坠落者出现。"
    }
  };

  const storytellerData = {
    cassandra: { name: "卡桑德拉·经典", description: "卡桑德拉按照经典的紧张曲线制造事件。她会施加压力，留下喘息时间，然后再次推动故事。", art: "cassandra-art" },
    phoebe: { name: "菲比·悠闲", description: "菲比会在灾难之间留下较长的建设时间，但在较高难度下，她造成的打击仍然十分强烈。", art: "phoebe-art" },
    randy: { name: "兰迪·随机", description: "兰迪不遵循固定规则。他制造随机事件，也不在乎这些事件最终带来胜利还是绝望。", art: "randy-art" }
  };

  const siteData = {
    forest: { tile:"阿尔比昂山谷 · 42.16°N", biome:"温带森林", description:"生态群落：温带森林", movement:"2.2 天", terrain:"大型丘陵", stone:"花岗岩、大理石、石灰岩", elevation:"海拔 486 米", road:"古代沥青路", river:"河流", temperature:"年均 16℃", range:"4℃ 至 29℃", rainfall:"1,240 毫米", growing:"四季生长", forage:"100%", disease:"1.0 / 年" },
    desert: { tile:"红沙边地 · 18.04°S", biome:"干旱灌木原", description:"生态群落：干旱灌木原", movement:"1.0 天", terrain:"平原", stone:"砂岩、石灰岩", elevation:"海拔 214 米", road:"无", river:"无", temperature:"年均 28℃", range:"15℃ 至 42℃", rainfall:"310 毫米", growing:"全年生长", forage:"80%", disease:"1.2 / 年" },
    mountain: { tile:"灰脊山脉 · 35.72°N", biome:"温带森林", description:"生态群落：温带森林", movement:"3.5 天", terrain:"山地", stone:"花岗岩、板岩、大理石", elevation:"海拔 1,368 米", road:"土路", river:"无", temperature:"年均 11℃", range:"-3℃ 至 25℃", rainfall:"930 毫米", growing:"40 / 60 天", forage:"90%", disease:"0.8 / 年" },
    tundra: { tile:"白风原 · 61.22°N", biome:"冻土苔原", description:"生态群落：冻土苔原", movement:"1.5 天", terrain:"小型丘陵", stone:"板岩、花岗岩", elevation:"海拔 392 米", road:"无", river:"小溪", temperature:"年均 -5℃", range:"-28℃ 至 12℃", rainfall:"420 毫米", growing:"20 / 60 天", forage:"50%", disease:"0.3 / 年" }
  };

  const planetBiomes = [
    { id:0, key:"ocean", name:"海洋", color:[0.035, 0.115, 0.190] },
    { id:1, key:"temperateForest", name:"温带森林", color:[0.430, 0.620, 0.310] },
    { id:2, key:"temperateSwamp", name:"温带沼泽", color:[0.300, 0.470, 0.245] },
    { id:3, key:"borealForest", name:"寒带森林", color:[0.275, 0.430, 0.345] },
    { id:4, key:"coldBog", name:"寒带沼泽", color:[0.335, 0.490, 0.455] },
    { id:5, key:"tropicalRainforest", name:"热带雨林", color:[0.075, 0.295, 0.135] },
    { id:6, key:"tropicalSwamp", name:"热带沼泽", color:[0.095, 0.235, 0.155] },
    { id:7, key:"aridShrubland", name:"干旱灌木原", color:[0.625, 0.555, 0.295] },
    { id:8, key:"desert", name:"沙漠", color:[0.775, 0.650, 0.310] },
    { id:9, key:"extremeDesert", name:"极端沙漠", color:[0.710, 0.545, 0.250] },
    { id:10, key:"tundra", name:"冻土苔原", color:[0.475, 0.575, 0.545] },
    { id:11, key:"iceSheet", name:"冰原", color:[0.465, 0.615, 0.690] },
    { id:12, key:"seaIce", name:"海洋冰盖", color:[0.675, 0.785, 0.830] }
  ];

  const roadTypes = [
    { name:"小径", priority:1, color:[0.46, 0.37, 0.24] },
    { name:"土路", priority:2, color:[0.61, 0.43, 0.22] },
    { name:"石路", priority:3, color:[0.58, 0.58, 0.53] },
    { name:"古代沥青路", priority:4, color:[0.27, 0.29, 0.29] },
    { name:"古代沥青公路", priority:5, color:[0.39, 0.41, 0.40] }
  ];

  const riverTypes = [
    { name:"小溪", priority:1, color:[0.22, 0.54, 0.73] },
    { name:"河流", priority:2, color:[0.16, 0.47, 0.70] },
    { name:"大河", priority:3, color:[0.10, 0.39, 0.66] },
    { name:"巨河", priority:4, color:[0.07, 0.31, 0.59] }
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
    const latitude = Math.abs(center[1]);
    const moisture = planetFbm(center.map((value, index) => value * 3.5 + [9.7, 2.1, 6.3][index]));
    let biome;
    if (elevation < 0) biome = latitude > 0.84 ? planetBiomes[12] : planetBiomes[0];
    else if (latitude > 0.87) biome = planetBiomes[11];
    else if (latitude > 0.70) biome = planetBiomes[10];
    else if (latitude > 0.53) biome = moisture > 0.58 ? planetBiomes[4] : planetBiomes[3];
    else if (latitude < 0.36 && moisture > 0.58) biome = planetBiomes[6];
    else if (latitude < 0.36 && moisture > 0.50) biome = planetBiomes[5];
    else if (latitude < 0.40 && moisture < 0.31) biome = planetBiomes[9];
    else if (latitude < 0.48 && moisture < 0.39) biome = planetBiomes[8];
    else if (latitude < 0.50 && moisture < 0.48) biome = planetBiomes[7];
    else if (moisture > 0.64) biome = planetBiomes[2];
    else biome = planetBiomes[1];
    return { biome, elevation, moisture, latitude };
  }

  function buildGeodesicCells(frequency = 14) {
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
    const baseVertices = [
      [-1,goldenRatio,0],[1,goldenRatio,0],[-1,-goldenRatio,0],[1,-goldenRatio,0],
      [0,-1,goldenRatio],[0,1,goldenRatio],[0,-1,-goldenRatio],[0,1,-goldenRatio],
      [goldenRatio,0,-1],[goldenRatio,0,1],[-goldenRatio,0,-1],[-goldenRatio,0,1]
    ].map(normalize);
    const baseFaces = [
      [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
      [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
      [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
      [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];
    const vertices = [];
    const faces = [];
    const vertexCache = new Map();
    const addVertex = (point) => {
      const normalized = normalize(point);
      const key = normalized.map((value) => value.toFixed(9)).join(":");
      if (vertexCache.has(key)) return vertexCache.get(key);
      const index = vertices.length;
      vertices.push(normalized);
      vertexCache.set(key, index);
      return index;
    };
    baseFaces.forEach(([aIndex, bIndex, cIndex]) => {
      const a = baseVertices[aIndex];
      const b = baseVertices[bIndex];
      const c = baseVertices[cIndex];
      const grid = new Map();
      const at = (i, j) => grid.get(`${i}:${j}`);
      for (let i = 0; i <= frequency; i += 1) {
        for (let j = 0; j <= frequency - i; j += 1) {
          const aWeight = frequency - i - j;
          grid.set(`${i}:${j}`, addVertex([
            (a[0] * aWeight + b[0] * i + c[0] * j) / frequency,
            (a[1] * aWeight + b[1] * i + c[1] * j) / frequency,
            (a[2] * aWeight + b[2] * i + c[2] * j) / frequency
          ]));
        }
      }
      for (let i = 0; i < frequency; i += 1) {
        for (let j = 0; j < frequency - i; j += 1) {
          faces.push([at(i, j), at(i + 1, j), at(i, j + 1)]);
          if (i + j < frequency - 1) faces.push([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
        }
      }
    });

    const faceCenters = faces.map(([a, b, c]) => normalize([
      vertices[a][0] + vertices[b][0] + vertices[c][0],
      vertices[a][1] + vertices[b][1] + vertices[c][1],
      vertices[a][2] + vertices[b][2] + vertices[c][2]
    ]));
    const adjacentFaces = vertices.map(() => []);
    faces.forEach((face, faceIndex) => face.forEach((vertexIndex) => adjacentFaces[vertexIndex].push(faceIndex)));

    const neighborSets = vertices.map(() => new Set());
    faces.forEach(([a, b, c]) => {
      neighborSets[a].add(b); neighborSets[a].add(c);
      neighborSets[b].add(a); neighborSets[b].add(c);
      neighborSets[c].add(a); neighborSets[c].add(b);
    });

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
      const climate = classifyPlanetCell(center);
      const biome = climate.biome;
      return {
        id: index + 1,
        key: `tile-${String(index + 1).padStart(4, "0")}`,
        center,
        corners,
        sides: corners.length,
        biomeId: biome.id,
        biomeKey: biome.key,
        biomeName: biome.name,
        color: biome.color,
        elevation: climate.elevation,
        moisture: climate.moisture,
        neighbors: Array.from(neighborSets[index]),
        roadLinks: [],
        riverLinks: [],
        roadName: "无",
        riverName: "无",
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

  function buildPlanetRoutes(cells, preferredHubs = []) {
    const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const normalize = (point) => {
      const length = Math.hypot(...point) || 1;
      return point.map((value) => value / length);
    };
    const routeHash = (cell, salt) => planetHash(cell.center.map((value, index) => value * (salt + index * 2.71) + salt));
    const riverEdges = new Map();
    const roadEdges = new Map();

    const coastDistance = new Int32Array(cells.length);
    coastDistance.fill(2147483647);
    const queue = [];
    cells.forEach((cell, index) => {
      if (cell.biomeKey === "ocean") {
        coastDistance[index] = 0;
        queue.push(index);
      }
    });
    for (let head = 0; head < queue.length; head += 1) {
      const index = queue[head];
      const nextDistance = coastDistance[index] + 1;
      cells[index].neighbors.forEach((neighborIndex) => {
        if (nextDistance >= coastDistance[neighborIndex]) return;
        coastDistance[neighborIndex] = nextDistance;
        queue.push(neighborIndex);
      });
    }

    const sourceCandidates = cells
      .map((cell, index) => ({ cell, index, score:cell.elevation * 1.3 + cell.moisture * 0.8 + routeHash(cell, 5) * 0.18 }))
      .filter(({ cell, index }) => cell.biomeKey !== "ocean" && cell.biomeKey !== "seaIce" && cell.elevation > 0.035 && cell.moisture > 0.50 && coastDistance[index] > 4)
      .sort((a, b) => b.score - a.score);
    const riverSources = [];
    for (const candidate of sourceCandidates) {
      if (riverSources.every((source) => dot(source.cell.center, candidate.cell.center) < 0.965)) riverSources.push(candidate);
      if (riverSources.length >= 24) break;
    }
    riverSources.forEach(({ index:sourceIndex }) => {
      let currentIndex = sourceIndex;
      const visited = new Set([currentIndex]);
      for (let step = 0; step < 80 && coastDistance[currentIndex] > 0; step += 1) {
        const current = cells[currentIndex];
        const candidates = current.neighbors.filter((neighborIndex) => coastDistance[neighborIndex] < coastDistance[currentIndex] && !visited.has(neighborIndex));
        if (!candidates.length) break;
        let nextIndex = candidates[0];
        let bestScore = Infinity;
        candidates.forEach((neighborIndex) => {
          const neighbor = cells[neighborIndex];
          const existing = riverEdges.get(edgeKey(currentIndex, neighborIndex));
          const score = coastDistance[neighborIndex] * 2.4 + Math.max(0, neighbor.elevation) * 0.85 + routeHash(neighbor, 9) * 0.16 - (existing?.flow || 0) * 0.72;
          if (score < bestScore) {
            bestScore = score;
            nextIndex = neighborIndex;
          }
        });
        const key = edgeKey(currentIndex, nextIndex);
        const record = riverEdges.get(key) || { a:currentIndex, b:nextIndex, flow:0, progress:0 };
        record.flow += 1;
        record.progress = Math.max(record.progress, step);
        riverEdges.set(key, record);
        currentIndex = nextIndex;
        visited.add(currentIndex);
      }
    });

    const landCells = cells.filter((cell) => cell.biomeKey !== "ocean" && cell.biomeKey !== "seaIce");
    const hubs = [];
    preferredHubs.forEach((cell) => {
      if (cell && cell.biomeKey !== "ocean" && !hubs.includes(cell)) hubs.push(cell);
    });
    [...landCells]
      .sort((a, b) => routeHash(b, 13) - routeHash(a, 13))
      .forEach((candidate) => {
        if (hubs.length >= 24) return;
        if (hubs.every((hub) => dot(hub.center, candidate.center) < 0.955)) hubs.push(candidate);
      });

    function findRoadPath(startIndex, endIndex) {
      const distanceScores = new Float64Array(cells.length);
      distanceScores.fill(Infinity);
      const previous = new Int32Array(cells.length);
      previous.fill(-1);
      const heap = [];
      const push = (item) => {
        heap.push(item);
        let index = heap.length - 1;
        while (index > 0) {
          const parent = (index - 1) >> 1;
          if (heap[parent][0] <= item[0]) break;
          heap[index] = heap[parent];
          index = parent;
        }
        heap[index] = item;
      };
      const pop = () => {
        const root = heap[0];
        const tail = heap.pop();
        if (heap.length && tail) {
          let index = 0;
          while (true) {
            const left = index * 2 + 1;
            const right = left + 1;
            if (left >= heap.length) break;
            const child = right < heap.length && heap[right][0] < heap[left][0] ? right : left;
            if (heap[child][0] >= tail[0]) break;
            heap[index] = heap[child];
            index = child;
          }
          heap[index] = tail;
        }
        return root;
      };
      const biomePenalty = {
        temperateSwamp:0.65, coldBog:0.75, tropicalSwamp:0.85,
        tropicalRainforest:0.35, desert:0.28, extremeDesert:0.62,
        tundra:0.35, iceSheet:1.4
      };
      distanceScores[startIndex] = 0;
      push([0, startIndex]);
      while (heap.length) {
        const [, currentIndex] = pop();
        if (currentIndex === endIndex) break;
        const currentScore = distanceScores[currentIndex];
        cells[currentIndex].neighbors.forEach((neighborIndex) => {
          const neighbor = cells[neighborIndex];
          if (neighbor.biomeKey === "ocean" || neighbor.biomeKey === "seaIce") return;
          const penalty = biomePenalty[neighbor.biomeKey] || 0;
          const tentative = currentScore + 1 + penalty + Math.max(0, neighbor.elevation) * 0.16;
          if (tentative >= distanceScores[neighborIndex]) return;
          distanceScores[neighborIndex] = tentative;
          previous[neighborIndex] = currentIndex;
          const heuristic = Math.acos(Math.max(-1, Math.min(1, dot(neighbor.center, cells[endIndex].center)))) * 14;
          push([tentative + heuristic, neighborIndex]);
        });
      }
      if (previous[endIndex] < 0) return [];
      const path = [endIndex];
      let cursor = endIndex;
      while (cursor !== startIndex && path.length < cells.length) {
        cursor = previous[cursor];
        if (cursor < 0) return [];
        path.push(cursor);
      }
      return path.reverse();
    }

    const roadPairs = new Set();
    hubs.forEach((hub, hubIndex) => {
      const nearest = hubs
        .map((candidate, candidateIndex) => ({ candidate, candidateIndex, score:dot(hub.center, candidate.center) }))
        .filter(({ candidateIndex }) => candidateIndex !== hubIndex)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      nearest.forEach(({ candidateIndex }) => roadPairs.add(edgeKey(hubIndex, candidateIndex)));
    });
    roadPairs.forEach((pair) => {
      const [firstHubIndex, secondHubIndex] = pair.split(":").map(Number);
      const startIndex = hubs[firstHubIndex].id - 1;
      const endIndex = hubs[secondHubIndex].id - 1;
      const path = findRoadPath(startIndex, endIndex);
      const typeRoll = routeHash(hubs[firstHubIndex], secondHubIndex + 17);
      const type = typeRoll < 0.13 ? roadTypes[4] : typeRoll < 0.29 ? roadTypes[3] : typeRoll < 0.51 ? roadTypes[2] : typeRoll < 0.80 ? roadTypes[1] : roadTypes[0];
      for (let index = 0; index < path.length - 1; index += 1) {
        const a = path[index];
        const b = path[index + 1];
        const key = edgeKey(a, b);
        const existing = roadEdges.get(key);
        if (!existing || existing.type.priority < type.priority) roadEdges.set(key, { a, b, type });
      }
    });

    riverEdges.forEach((record) => {
      const strength = record.flow + Math.min(3.2, record.progress / 6);
      record.type = strength >= 6.5 ? riverTypes[3] : strength >= 4.2 ? riverTypes[2] : strength >= 2.4 ? riverTypes[1] : riverTypes[0];
      cells[record.a].riverLinks.push({ neighbor:record.b, type:record.type });
      cells[record.b].riverLinks.push({ neighbor:record.a, type:record.type });
    });
    roadEdges.forEach((record) => {
      cells[record.a].roadLinks.push({ neighbor:record.b, type:record.type });
      cells[record.b].roadLinks.push({ neighbor:record.a, type:record.type });
    });
    cells.forEach((cell) => {
      if (cell.roadLinks.length) cell.roadName = cell.roadLinks.reduce((best, link) => link.type.priority > best.priority ? link.type : best, cell.roadLinks[0].type).name;
      if (cell.riverLinks.length) cell.riverName = cell.riverLinks.reduce((best, link) => link.type.priority > best.priority ? link.type : best, cell.riverLinks[0].type).name;
    });

    const roadPositions = [];
    const roadColors = [];
    const riverPositions = [];
    const riverColors = [];
    const pushArc = (positionTarget, colorTarget, record) => {
      const start = cells[record.a].center;
      const end = cells[record.b].center;
      const middle = normalize([start[0] + end[0], start[1] + end[1], start[2] + end[2]]);
      positionTarget.push(...start, ...middle, ...middle, ...end);
      for (let index = 0; index < 4; index += 1) colorTarget.push(...record.type.color);
    };
    riverEdges.forEach((record) => pushArc(riverPositions, riverColors, record));
    roadEdges.forEach((record) => pushArc(roadPositions, roadColors, record));
    return { roadPositions, roadColors, riverPositions, riverColors, roadCount:roadEdges.size, riverCount:riverEdges.size };
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
          return { id: 1, key: "tile-0001", sides: 6, lat, lon, biomeId:1, biomeKey:"temperateForest", biomeName:"温带森林", roadName:"无", riverName:"无" };
        },
        zoomBy() {},
        resetView() {},
        getStats() {
          return { cells: 0, pentagons: 0, hexagons: 0 };
        }
      };
    }

    if (!gl) return fallback();

    const vertexSource = `
      attribute vec3 aPosition;
      attribute float aCellSides;
      attribute vec3 aColor;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uAspect;
      uniform float uDistance;
      uniform float uRadius;
      varying float vCellSides;
      varying vec3 vColor;
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
        vColor = aColor;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform float uLayer;
      uniform float uSelected;
      varying float vCellSides;
      varying vec3 vColor;
      void main() {
        if (uLayer > 2.5) {
          gl_FragColor = vec4(vColor, 0.96);
          return;
        }
        if (uLayer > 1.5) {
          gl_FragColor = vec4(vColor, 0.94);
          return;
        }
        if (uLayer > 0.5) {
          vec3 edgeColor = uSelected > 0.5 ? vec3(1.0, 0.76, 0.20) : vCellSides < 5.5 ? vec3(0.88, 0.68, 0.31) : vec3(0.66, 0.70, 0.66);
          float edgeAlpha = uSelected > 0.5 ? 0.96 : vCellSides < 5.5 ? 0.34 : 0.16;
          gl_FragColor = vec4(edgeColor, edgeAlpha);
          return;
        }
        gl_FragColor = vec4(vColor, 1.0);
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

    const geodesic = buildGeodesicCells(14);
    const { cells, surfacePositions, surfaceSides, wirePositions, wireSides } = geodesic;
    const forcedSiteBiomes = { forest:1, desert:7, mountain:1, tundra:10 };
    const preferredHubs = [];
    siteButtons.forEach((button) => {
      const biome = planetBiomes[forcedSiteBiomes[button.dataset.site] ?? 1];
      const cell = getCell(Number(button.dataset.lat), Number(button.dataset.lon));
      cell.biomeId = biome.id;
      cell.biomeKey = biome.key;
      cell.biomeName = biome.name;
      cell.color = biome.color;
      preferredHubs.push(cell);
    });
    const routeGeometry = buildPlanetRoutes(cells, preferredHubs);
    const { roadPositions, roadColors, riverPositions, riverColors } = routeGeometry;
    const surfaceColors = [];
    cells.forEach((cell) => cell.corners.forEach(() => surfaceColors.push(...cell.color, ...cell.color, ...cell.color)));
    const biomeCounts = Object.fromEntries(planetBiomes.map((biome) => [biome.key, cells.filter((cell) => cell.biomeId === biome.id).length]));
    container.dataset.cellCount = String(cells.length);
    container.dataset.pentagonCount = String(cells.filter((cell) => cell.sides === 5).length);
    container.dataset.hexagonCount = String(cells.filter((cell) => cell.sides === 6).length);
    container.dataset.biomeCounts = JSON.stringify(biomeCounts);
    container.dataset.roadSegmentCount = String(routeGeometry.roadCount);
    container.dataset.riverSegmentCount = String(routeGeometry.riverCount);

    function createBuffer(data) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return buffer;
    }
    const surfacePositionBuffer = createBuffer(surfacePositions);
    const surfaceSidesBuffer = createBuffer(surfaceSides);
    const surfaceColorBuffer = createBuffer(surfaceColors);
    const wirePositionBuffer = createBuffer(wirePositions);
    const wireSidesBuffer = createBuffer(wireSides);
    const roadPositionBuffer = createBuffer(roadPositions);
    const roadColorBuffer = createBuffer(roadColors);
    const riverPositionBuffer = createBuffer(riverPositions);
    const riverColorBuffer = createBuffer(riverColors);
    const selectedWirePositionBuffer = createBuffer([]);
    const selectedWireSidesBuffer = createBuffer([]);
    let selectedWireVertexCount = 0;
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const cellSidesLocation = gl.getAttribLocation(program, "aCellSides");
    const colorLocation = gl.getAttribLocation(program, "aColor");
    const uniforms = {
      yaw: gl.getUniformLocation(program, "uYaw"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      aspect: gl.getUniformLocation(program, "uAspect"),
      distance: gl.getUniformLocation(program, "uDistance"),
      radius: gl.getUniformLocation(program, "uRadius"),
      layer: gl.getUniformLocation(program, "uLayer"),
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
      gl.bindBuffer(gl.ARRAY_BUFFER, surfaceColorBuffer);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.radius, 1);
      gl.uniform1f(uniforms.layer, 0);
      gl.drawArrays(gl.TRIANGLES, 0, surfacePositions.length / 3);

      gl.bindBuffer(gl.ARRAY_BUFFER, wirePositionBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, wireSidesBuffer);
      gl.vertexAttribPointer(cellSidesLocation, 1, gl.FLOAT, false, 0, 0);
      gl.disableVertexAttribArray(colorLocation);
      gl.vertexAttrib3f(colorLocation, 0, 0, 0);
      gl.uniform1f(uniforms.radius, 1.0025);
      gl.uniform1f(uniforms.layer, 1);
      gl.drawArrays(gl.LINES, 0, wirePositions.length / 3);

      gl.bindBuffer(gl.ARRAY_BUFFER, riverPositionBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, riverColorBuffer);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.radius, 1.007);
      gl.uniform1f(uniforms.layer, 3);
      gl.lineWidth(2);
      gl.drawArrays(gl.LINES, 0, riverPositions.length / 3);

      gl.bindBuffer(gl.ARRAY_BUFFER, roadPositionBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, roadColorBuffer);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.radius, 1.010);
      gl.uniform1f(uniforms.layer, 2);
      gl.lineWidth(1);
      gl.drawArrays(gl.LINES, 0, roadPositions.length / 3);

      if (selectedWireVertexCount) {
        gl.bindBuffer(gl.ARRAY_BUFFER, selectedWirePositionBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, selectedWireSidesBuffer);
        gl.vertexAttribPointer(cellSidesLocation, 1, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(colorLocation);
        gl.vertexAttrib3f(colorLocation, 0, 0, 0);
        gl.uniform1f(uniforms.radius, 1.014);
        gl.uniform1f(uniforms.layer, 1);
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
    let pinching = false;
    let pinchStartSpan = 0;
    let pinchStartDistance = distance;
    const activePointers = new Map();
    const clampDistance = (value) => Math.max(1.65, Math.min(5.2, value));
    canvas.addEventListener("pointerdown", (event) => {
      activePointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      dragged = false;
      canvas.setPointerCapture(pointerId);
      if (activePointers.size === 2) {
        const [first, second] = Array.from(activePointers.values());
        pinchStartSpan = Math.hypot(second.x - first.x, second.y - first.y);
        pinchStartDistance = distance;
        pinching = true;
        dragged = true;
      }
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
      if (activePointers.size >= 2) {
        const [first, second] = Array.from(activePointers.values());
        const span = Math.max(20, Math.hypot(second.x - first.x, second.y - first.y));
        distance = clampDistance(pinchStartDistance * pinchStartSpan / span);
        pinching = true;
        dragged = true;
        render();
        return;
      }
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
      const wasPinching = pinching;
      activePointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (activePointers.size === 1) {
        const [remainingId, remaining] = Array.from(activePointers.entries())[0];
        pointerId = remainingId;
        startX = lastX = remaining.x;
        startY = lastY = remaining.y;
        dragged = true;
      } else if (activePointers.size === 0) {
        pointerId = null;
        pinching = false;
      }
      if (wasPinching) return;
      if (dragged) return;
      const cell = surfacePointFromEvent(event);
      if (cell) onSurfacePick(cell.lat, cell.lon, cell);
    });
    canvas.addEventListener("pointercancel", (event) => {
      activePointers.delete(event.pointerId);
      if (!activePointers.size) {
        pointerId = null;
        pinching = false;
      }
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      distance = clampDistance(distance + event.deltaY * 0.0025);
      render();
    }, { passive: false });
    canvas.addEventListener("dblclick", (event) => {
      event.preventDefault();
      const cell = surfacePointFromEvent(event);
      if (!cell) return;
      yaw = -cell.lon * Math.PI / 180;
      pitch = Math.max(-1.18, Math.min(1.18, cell.lat * Math.PI / 180));
      distance = 2.05;
      onSurfacePick(cell.lat, cell.lon, cell);
      render();
    });
    canvas.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","-","="];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") yaw -= 0.12;
      if (event.key === "ArrowRight") yaw += 0.12;
      if (event.key === "ArrowUp") pitch = Math.max(-1.22, pitch - 0.1);
      if (event.key === "ArrowDown") pitch = Math.min(1.22, pitch + 0.1);
      if (event.key === "+" || event.key === "=") distance = clampDistance(distance - 0.22);
      if (event.key === "-") distance = clampDistance(distance + 0.22);
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
      zoomBy(amount) {
        distance = clampDistance(distance + amount);
        render();
      },
      resetView() {
        yaw = 0;
        pitch = 0.12;
        distance = 3.55;
        render();
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
    lin: { name:"林", job:"空间站工程师", gender:"女性", age:27, appearance:"黑色短发，灰色眼睛，体型匀称。", childhood:"轨道贫民", adulthood:"空间站工程师", incapable:"无", traits:["勤劳","坚韧"], health:"全身：健康", relations:"没有关系", skills:[6,3,9,5,4,5,2,6,7,1,4,3], focus:[2,7,11] },
    mira: { name:"米拉", job:"乡村医生", gender:"女性", age:34, appearance:"棕色长发，神情温和，身形纤细。", childhood:"农场孩子", adulthood:"乡村医生", incapable:"暴力", traits:["乐观","善良"], health:"左眼：视力减弱", relations:"没有关系", skills:[1,1,4,2,6,5,4,2,3,10,7,5], focus:[4,9,10] },
    grey: { name:"格雷", job:"佣兵", gender:"男性", age:41, appearance:"灰色短发，面部有旧伤，体格结实。", childhood:"街头顽童", adulthood:"佣兵", incapable:"照料", traits:["冷静","好斗"], health:"躯干：旧枪伤", relations:"没有关系", skills:[11,9,3,2,2,1,1,5,6,2,4,1], focus:[0,1,7] },
    yan: { name:"燕", job:"作物学家", gender:"女性", age:30, appearance:"深棕发，绿色眼睛，常带着田间劳作留下的晒痕。", childhood:"温室学生", adulthood:"作物学家", incapable:"采矿", traits:["神经质","快步"], health:"全身：健康", relations:"没有关系", skills:[4,2,5,1,4,12,6,4,2,3,3,7], focus:[5,6,11] },
    sol: { name:"索尔", job:"矿工", gender:"男性", age:38, appearance:"深色卷发，肩背宽厚，双手布满老茧。", childhood:"矿镇少年", adulthood:"深层矿工", incapable:"艺术", traits:["地下居民","坚韧"], health:"右腿：旧伤", relations:"没有关系", skills:[4,6,5,12,3,2,1,7,4,2,2,1], focus:[1,3,7] },
    nora: { name:"诺拉", job:"流浪学者", gender:"女性", age:45, appearance:"银灰长发，戴着旧眼镜，身形清瘦。", childhood:"书库助手", adulthood:"流浪学者", incapable:"搬运", traits:["过目不忘","悲观"], health:"全身：健康", relations:"没有关系", skills:[2,1,2,1,4,3,2,4,6,5,8,13], focus:[8,10,11] },
    axel: { name:"阿克塞尔", job:"商队护卫", gender:"男性", age:29, appearance:"金色短发，五官端正，习惯观察远处。", childhood:"商队孩子", adulthood:"商队护卫", incapable:"研究", traits:["漂亮","谨慎射手"], health:"全身：健康", relations:"没有关系", skills:[10,5,4,2,2,3,6,5,3,2,9,0], focus:[0,6,10] },
    mei: { name:"梅", job:"厨师", gender:"女性", age:25, appearance:"黑色长发束在脑后，脸颊略圆，动作利落。", childhood:"餐馆学徒", adulthood:"厨师", incapable:"无", traits:["嗜睡","美食家"], health:"全身：健康", relations:"没有关系", skills:[3,2,3,1,12,5,2,6,4,2,5,3], focus:[4,5,7] }
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
  document.getElementById("scenarioNext").addEventListener("click", () => {
    showScreen("screen-storyteller");
  });

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
  let selectedSiteData = null;
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
    const biome = cell.biomeName;
    const terrain = roughness > 0.83 ? "山地" : roughness > 0.57 ? "大型丘陵" : roughness > 0.3 ? "小型丘陵" : "平原";
    const road = cell.roadName || "无";
    const river = cell.riverName || "无";
    const temperature = Math.round(30 - absoluteLatitude * 0.53 + (moisture - 0.5) * 6);
    const lowTemperature = temperature - Math.round(8 + absoluteLatitude * 0.12);
    const highTemperature = temperature + Math.round(9 + (1 - moisture) * 5);
    const growingDays = temperature > 18 ? "全年生长" : temperature > 7 ? `${Math.max(20, Math.round(60 - absoluteLatitude * 0.55))} / 60 天` : temperature > -8 ? "20 / 60 天" : "无法生长";
    const stoneSets = ["花岗岩、石灰岩", "砂岩、板岩", "大理石、花岗岩", "板岩、大理石、石灰岩"];
    const biomeLabel = biome === "海洋" ? "深海水域，不可选择为着陆点。" : `生态群落：${biome}`;
    const movementByTerrain = { "平原":"1.0 天", "小型丘陵":"1.5 天", "大型丘陵":"2.2 天", "山地":"3.5 天" };
    if (cell.biomeKey === "ocean") {
      return {
        tile:`第 ${cell.id} 地块 · ${coordinateLabel(lat, "N", "S")} ${coordinateLabel(lon, "E", "W")}`,
        region:`${cell.key} · ${cell.sides === 5 ? "五边形" : "六边形"}`,
        biome,
        description:biomeLabel,
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
      description:biomeLabel,
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
      disease:`${biome === "热带雨林" || biome === "热带沼泽" ? "2.4" : biome === "冰原" || biome === "海洋冰盖" || biome === "冻土苔原" ? "0.3" : "1.0"} / 年`,
      landingAllowed:true
    };
  }

  function renderSiteInfo(data) {
    selectedSiteData = data.landingAllowed === false ? null : { ...data };
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
      description:`生态群落：${cell.biomeName}`,
      road:cell.roadName || "无",
      river:cell.riverName || "无",
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
  document.getElementById("globeZoomIn").addEventListener("click", () => planetController.zoomBy(-0.35));
  document.getElementById("globeZoomOut").addEventListener("click", () => planetController.zoomBy(0.35));
  document.getElementById("globeResetView").addEventListener("click", () => planetController.resetView());

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
  const skillKeys = ["shooting","melee","construction","mining","cooking","plants","animals","crafting","artistic","medical","social","intellectual"];
  const passionData = {
    lin: { 2:2, 7:1, 11:1 }, mira: { 4:1, 9:2, 10:1 }, grey: { 0:2, 1:1, 7:1 }, yan: { 5:2, 6:1, 11:1 },
    sol: { 1:1, 3:2, 7:1 }, nora: { 8:1, 10:1, 11:2 }, axel: { 0:2, 6:1, 10:1 }, mei: { 4:2, 5:1, 10:1 }
  };
  const traitPool = ["勤劳","懒惰","坚韧","乐观","悲观","神经质","钢铁意志","精神敏感","精神迟钝","嗜血","好斗","快步","慢步","地下居民","夜猫子","漂亮","丑陋","谨慎射手","亢奋射手","善良","心理变态","苦行者","嗜睡","美食家","过目不忘"];
  const traitConflicts = [
    ["勤劳","懒惰"], ["乐观","悲观"], ["钢铁意志","神经质"], ["精神敏感","精神迟钝"],
    ["快步","慢步"], ["漂亮","丑陋"], ["谨慎射手","亢奋射手"], ["善良","心理变态"]
  ];
  const namePools = {
    女性:["林","米拉","燕","诺拉","梅","艾琳","塞拉","伊芙","罗莎","青禾"],
    男性:["格雷","索尔","阿克塞尔","凯恩","雷欧","伊森","罗伊","莫里斯","陆","陈"],
    其他:["岚","星","零","灰","澄","安","弥","秋"]
  };
  const childhoodPool = ["轨道贫民","农场孩子","街头顽童","温室学生","矿镇少年","书库助手","商队孩子","餐馆学徒","空间站孤儿","工业城学徒"];
  const adulthoodPool = ["空间站工程师","乡村医生","佣兵","作物学家","深层矿工","流浪学者","商队护卫","厨师","机械维修师","边境拓荒者"];
  const appearancePool = [
    "黑色短发，深色眼睛，体型匀称。", "棕色长发，神情温和，身形纤细。", "灰色短发，面部留有浅色旧伤。",
    "深棕发，绿色眼睛，有明显的户外晒痕。", "浅金短发，肩背宽厚，动作沉稳。", "银灰长发，戴着旧眼镜，身形清瘦。"
  ];
  let selectedCandidate = "lin";
  let currentSkills = [];
  let currentPassions = [];

  function clampSkill(value) {
    return Math.max(0, Math.min(20, Math.round(Number(value) || 0)));
  }

  function traitsFromEditor() {
    return document.getElementById("traitData").value.split(/[\n,，、;；]+/).map((item) => item.trim()).filter(Boolean);
  }

  function setTraitEditor(traits) {
    document.getElementById("traitData").value = traits.join("\n");
  }

  function hasTraitConflict(selected, candidate) {
    return traitConflicts.some((pair) => pair.includes(candidate) && pair.some((item) => item !== candidate && selected.includes(item)));
  }

  function randomTraitList() {
    const desired = Math.random() < 0.38 ? 3 : 2;
    const shuffled = [...traitPool].sort(() => Math.random() - 0.5);
    const selected = [];
    for (const trait of shuffled) {
      if (!hasTraitConflict(selected, trait)) selected.push(trait);
      if (selected.length >= desired) break;
    }
    return selected;
  }

  function randomFrom(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function randomizeTextField(inputId, pool) {
    const input = document.getElementById(inputId);
    input.value = randomFrom(pool);
    input.classList.remove("is-custom");
    input.dataset.mode = "random";
  }

  function enableCustomField(inputId, label) {
    const input = document.getElementById(inputId);
    input.classList.add("is-custom");
    input.dataset.mode = "custom";
    input.focus();
    input.select();
    showToast(`${label}已切换为自定义填写。`);
  }

  function updateCandidateSummary() {
    const gender = document.getElementById("candidateGender").value;
    const age = Math.max(18, Math.min(90, Number(document.getElementById("candidateAge").value) || 18));
    document.getElementById("candidateAge").value = String(age);
    document.getElementById("candidateSummary").textContent = `新来者阵营成员，${gender}，生理年龄 ${age} 岁。所有资料均可继续手动修改。`;
  }

  function passionLabel(value) {
    return value === 2 ? "强烈兴趣" : value === 1 ? "兴趣" : "无兴趣";
  }

  function renderSkills() {
    document.getElementById("skillsData").innerHTML = currentSkills.map((level,index) => {
      const passion = currentPassions[index] || 0;
      const passionClass = passion === 2 ? "major" : passion === 1 ? "minor" : "none";
      return `<div class="skill-row" data-skill-index="${index}"><span>${skillNames[index]}</span><input class="skill-level" type="number" min="0" max="20" value="${clampSkill(level)}" aria-label="${skillNames[index]}等级"><button class="passion ${passionClass}" type="button" title="${passionLabel(passion)}" aria-label="切换${skillNames[index]}兴趣"></button><i style="width:${Math.min(100, clampSkill(level) / 20 * 100)}%"></i></div>`;
    }).join("");
    document.getElementById("teamSkills").innerHTML = currentSkills.map((level,index) => `<span>${skillNames[index]} <b>${clampSkill(level)}</b></span>`).join("");
  }

  function renderCandidate() {
    const data = candidateData[selectedCandidate];
    document.getElementById("candidateFirstName").value = data.name;
    document.getElementById("candidateNickName").value = data.name;
    document.getElementById("candidateLastName").value = "";
    document.getElementById("candidateGender").value = data.gender;
    document.getElementById("candidateAge").value = String(data.age);
    document.getElementById("candidateAppearance").value = data.appearance;
    document.getElementById("candidateChildhood").value = data.childhood;
    document.getElementById("candidateAdulthood").value = data.adulthood;
    document.getElementById("incapableData").value = data.incapable;
    setTraitEditor(data.traits);
    document.getElementById("healthData").textContent = data.health;
    document.getElementById("relationData").textContent = data.relations;
    document.getElementById("gearData").innerHTML = "简陋自动手枪<br>基础衣物";
    currentSkills = data.skills.slice();
    currentPassions = skillNames.map((_, index) => passionData[selectedCandidate][index] || 0);
    updateCandidateSummary();
    renderSkills();
  }

  function generateSkills() {
    const data = candidateData[selectedCandidate];
    const age = Number(document.getElementById("candidateAge").value) || data.age;
    const focus = new Set(data.focus || []);
    const experience = Math.max(0, Math.min(3, Math.floor((age - 18) / 13)));
    currentSkills = skillNames.map((_, index) => {
      const base = Math.floor((Math.random() + Math.random() + Math.random()) * 2.15);
      const focusBonus = focus.has(index) ? 4 + Math.floor(Math.random() * 6) : 0;
      return clampSkill(base + experience + focusBonus);
    });
    currentPassions = Array(skillNames.length).fill(0);
    const weighted = skillNames.map((_, index) => ({ index, score:Math.random() + (focus.has(index) ? 0.8 : 0) })).sort((a,b) => b.score - a.score);
    const passionCount = 3 + Math.floor(Math.random() * 3);
    weighted.slice(0, passionCount).forEach(({ index }, order) => { currentPassions[index] = order < 2 && Math.random() < 0.7 ? 2 : 1; });
    renderSkills();
  }

  function randomizePawn() {
    const selectedGender = document.getElementById("candidateGender").value;
    const keys = Object.keys(candidateData);
    selectedCandidate = keys[Math.floor(Math.random() * keys.length)];
    const age = 18 + Math.floor(Math.random() * 43);
    const names = namePools[selectedGender] || namePools.其他;
    const name = randomFrom(names);
    document.getElementById("candidateAge").value = String(age);
    document.getElementById("candidateFirstName").value = name;
    document.getElementById("candidateNickName").value = name;
    document.getElementById("candidateLastName").value = "";
    randomizeTextField("candidateChildhood", childhoodPool);
    randomizeTextField("candidateAdulthood", adulthoodPool);
    document.getElementById("candidateAppearance").value = randomFrom(appearancePool);
    document.getElementById("incapableData").value = Math.random() < 0.72 ? "无" : randomFrom(["暴力","照料","采矿","艺术","研究"]);
    document.getElementById("healthData").textContent = "全身：健康";
    setTraitEditor(randomTraitList());
    document.getElementById("traitData").classList.remove("is-custom");
    document.getElementById("traitData").dataset.mode = "random";
    updateCandidateSummary();
    generateSkills();
  }
  document.getElementById("randomizePawn").addEventListener("click", () => {
    randomizePawn();
  });
  document.getElementById("randomizeChildhood").addEventListener("click", () => randomizeTextField("candidateChildhood", childhoodPool));
  document.getElementById("customizeChildhood").addEventListener("click", () => enableCustomField("candidateChildhood", "童年经历"));
  document.getElementById("randomizeAdulthood").addEventListener("click", () => randomizeTextField("candidateAdulthood", adulthoodPool));
  document.getElementById("customizeAdulthood").addEventListener("click", () => enableCustomField("candidateAdulthood", "成年经历"));
  document.getElementById("randomizeTraits").addEventListener("click", () => {
    setTraitEditor(randomTraitList());
    document.getElementById("traitData").classList.remove("is-custom");
    document.getElementById("traitData").dataset.mode = "random";
  });
  document.getElementById("customizeTraits").addEventListener("click", () => enableCustomField("traitData", "特性"));
  document.getElementById("randomizeSkills").addEventListener("click", generateSkills);
  document.getElementById("candidateGender").addEventListener("change", updateCandidateSummary);
  document.getElementById("candidateAge").addEventListener("input", updateCandidateSummary);
  document.getElementById("candidateFirstName").addEventListener("input", updateCandidateSummary);
  document.getElementById("skillsData").addEventListener("input", (event) => {
    const input = event.target.closest(".skill-level");
    if (!input) return;
    const row = input.closest(".skill-row");
    const index = Number(row.dataset.skillIndex);
    const level = clampSkill(input.value);
    currentSkills[index] = level;
    row.querySelector("i").style.width = `${Math.min(100, level / 20 * 100)}%`;
    const summaryValue = document.querySelector(`#teamSkills span:nth-child(${index + 1}) b`);
    if (summaryValue) summaryValue.textContent = level;
  });
  document.getElementById("skillsData").addEventListener("change", (event) => {
    const input = event.target.closest(".skill-level");
    if (!input) return;
    input.value = clampSkill(input.value);
  });
  document.getElementById("skillsData").addEventListener("click", (event) => {
    const button = event.target.closest(".passion");
    if (!button) return;
    const index = Number(button.closest(".skill-row").dataset.skillIndex);
    currentPassions[index] = ((currentPassions[index] || 0) + 1) % 3;
    renderSkills();
  });

  const difficultyNames = { peaceful:"和平休闲", community:"开拓建设", adventure:"孤星探险", strive:"荒野求生", blood:"残暴狂飙", losing:"冷酷无情", custom:"自定义" };
  const saveModeNames = { reload:"普通模式", commitment:"硬核模式" };
  const settingNames = ["极低","较低","正常","较高","极高"];

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
  }

  function collectPlayer() {
    const firstName = document.getElementById("candidateFirstName").value.trim();
    const nickname = document.getElementById("candidateNickName").value.trim();
    const lastName = document.getElementById("candidateLastName").value.trim();
    const displayName = nickname || firstName || "无名殖民者";
    const fullName = `${lastName}${firstName}`.trim() || displayName;
    const skills = Object.fromEntries(skillKeys.map((key,index) => [key, clampSkill(currentSkills[index])]));
    const passions = Object.fromEntries(skillKeys.map((key,index) => [key, passionLabel(currentPassions[index] || 0)]));
    return {
      name:displayName,
      full_name:fullName,
      gender:document.getElementById("candidateGender").value,
      age:Number(document.getElementById("candidateAge").value) || 18,
      appearance:document.getElementById("candidateAppearance").value.trim() || "未填写",
      childhood:document.getElementById("candidateChildhood").value.trim() || "未填写",
      adulthood:document.getElementById("candidateAdulthood").value.trim() || "未填写",
      incapable:document.getElementById("incapableData").value.trim() || "无",
      traits:traitsFromEditor(),
      skills,
      passions,
      condition:document.getElementById("healthData").textContent.trim() || "正常",
      equipment:["简陋自动手枪","基础衣物"]
    };
  }

  function collectLandingSite() {
    if (!selectedSiteData) throw new Error("尚未选择有效着陆点");
    const { landingAllowed, description, ...site } = selectedSiteData;
    return site;
  }

  function buildStartupData() {
    const player = collectPlayer();
    const site = collectLandingSite();
    const scenario = scenarioData.peony;
    const difficultyValue = document.querySelector("input[name='difficulty']:checked")?.value || "adventure";
    const saveModeValue = document.querySelector("input[name='saveMode']:checked")?.value || "reload";
    const activeFactions = Array.from(document.querySelectorAll("#factionList article:not(.is-disabled) b")).map((node) => node.textContent.trim());
    const worldSettings = {
      seed:document.getElementById("worldSeed").value.trim() || "white peony",
      coverage:document.getElementById("globeCoverage").value,
      rainfall:settingNames[Number(document.getElementById("rainfallSetting").value)] || "正常",
      temperature:settingNames[Number(document.getElementById("temperatureSetting").value)] || "正常",
      population:settingNames[Number(document.getElementById("populationSetting").value)] || "正常",
      active_factions:activeFactions
    };
    return {
      contract:"white-peony-start-v1",
      setup:{
        scenario:{
          id:"white-peony-settler",
          title:scenario.title,
          premise:scenario.intro,
          faction:scenario.faction,
          starting_colonists:1,
          starting_items:scenario.items.slice(),
          starting_inventory:{ ...scenario.inventory },
          starting_facilities:scenario.facilities.slice(),
          starting_equipment:scenario.equipment.slice(),
          special_rule:scenario.note,
          scripted_arrival:{
            character:"白牡丹",
            condition:"重伤昏迷",
            arrival:"逃生舱坠毁在玩家所选着陆区块附近",
            carried_item:"古锭刀"
          }
        },
        storyteller:storytellerData[selectedStoryteller].name,
        difficulty:difficultyNames[difficultyValue],
        save_mode:saveModeNames[saveModeValue],
        world:worldSettings
      },
      landing_site:site,
      player,
      initial_state:{
        schema_version:1,
        turn:0,
        world:{ day:1, time_period:"清晨", weather:"晴朗", scene_location:"逃生舱坠毁地点", active_event:"一枚严重受损的逃生舱坠毁在殖民地附近", storyteller:storytellerData[selectedStoryteller].name, difficulty:difficultyNames[difficultyValue] },
        landing_site:site,
        player:{ ...player, background:`童年：${player.childhood}；成年：${player.adulthood}` },
        bai_mudan:{
          condition:"重伤昏迷", emotion:"昏迷", affection:0, relationship_stage:"戒备", outfit:"常用旗袍", weapon:"古锭刀",
          skills:{ shooting:7, melee:18, construction:2, mining:4, cooking:1, plants:5, animals:6, crafting:8, artistic:7, medical:2, social:17, intellectual:2 },
          portrait_key:"default", expression_keys:[]
        },
        colony:{ facilities:scenario.facilities.slice(), inventory:{ ...scenario.inventory }, companions:[player.name] },
        plot:{ route:"NONE", route_locked:false, current_node:"OPEN", node_status:"active", completed_nodes:[], objective:"决定如何处理逃生舱中的幸存者", route_data:{} },
        scene:{ intimacy:"none", sex_asset_variant:"none", sex_pose_keys:[] },
        knowledge:{
          player_knows:["逃生舱坠毁在殖民地附近","舱内有一名重伤昏迷的成年萌螈女性","舱内存在一柄造型特殊的弯刃武器"],
          bai_mudan_knows:["萌螈王朝舰队遭到机械族入侵","卫队掩护她进入逃生舱","逃生舱原定航向萌螈王朝","霍拉克斯干扰并改写了逃生舱航线"]
        },
        continuity:{ last_major_event:"逃生舱坠毁", unresolved_matters:["幸存者尚未苏醒","逃生舱偏航原因不明"], established_facts:[] }
      }
    };
  }

  function buildStartupPrompt(data = buildStartupData()) {
    return `[白牡丹边缘世界·首轮初始化]\n\n这是由开局前端生成的首轮数据。请将 <startup-data> 中的内容作为本次游戏唯一初始状态，并以其中的 initial_state 生成最新 <game-state>。不要复述数据清单，不要重新随机人物或着陆点。\n\n<startup-data>\n${JSON.stringify(data, null, 2)}\n</startup-data>\n\n从第1天清晨的 OPEN 节点开始：玩家刚在所选区块安顿下来，一枚严重受损的逃生舱坠毁在殖民地附近。玩家目前只能观察到一名重伤昏迷的成年萌螈女性和一柄造型特殊的弯刃武器，不知道她的姓名、身份、原定目的地或霍拉克斯。\n\n请直接续写当前场景，并按角色卡固定契约输出：叙事正文；存在有效对白时输出1—3条对白；最新状态栏；五个行动选项。不得替玩家决定如何处理幸存者。`;
  }

  function renderTransfer() {
    const data = buildStartupData();
    const prompt = buildStartupPrompt(data);
    document.getElementById("startupPrompt").value = prompt;
    document.getElementById("startupSummary").innerHTML = `<h3>开局摘要</h3><dl><dt>剧本</dt><dd>${escapeHtml(data.setup.scenario.title)}</dd><dt>殖民者</dt><dd>${escapeHtml(data.player.name)} · ${escapeHtml(data.player.gender)} · ${data.player.age}岁</dd><dt>背景</dt><dd>${escapeHtml(data.player.childhood)} / ${escapeHtml(data.player.adulthood)}</dd><dt>特性</dt><dd>${escapeHtml(data.player.traits.join("、") || "无")}</dd><dt>叙事者</dt><dd>${escapeHtml(data.setup.storyteller)}</dd><dt>难度 / 存档</dt><dd>${escapeHtml(data.setup.difficulty)} / ${escapeHtml(data.setup.save_mode)}</dd><dt>地块</dt><dd>${escapeHtml(data.landing_site.tile)}</dd><dt>生态</dt><dd>${escapeHtml(data.landing_site.biome)}</dd><dt>地形</dt><dd>${escapeHtml(data.landing_site.terrain)}</dd><dt>道路 / 河流</dt><dd>${escapeHtml(data.landing_site.road)} / ${escapeHtml(data.landing_site.river)}</dd></dl>`;
    return prompt;
  }

  async function copyStartupPrompt({ automatic = false } = {}) {
    const text = document.getElementById("startupPrompt").value;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.getElementById("startupPrompt");
        area.focus();
        area.select();
        if (!document.execCommand("copy")) throw new Error("copy failed");
      }
      showToast(automatic ? "开局信息已生成并复制。" : "首轮提示词已复制。现在可以回到 AI风月开始游戏。");
      document.getElementById("copyStartupPrompt").textContent = "已复制";
      return true;
    } catch (error) {
      showToast("浏览器未允许自动复制，请在文本框中全选后手动复制。");
      return false;
    }
  }

  document.querySelectorAll("[data-setup-back]").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.setupBack));
  });
  document.getElementById("startColony").addEventListener("click", async () => {
    renderTransfer();
    await copyStartupPrompt({ automatic:true });
    withLoading("正在生成并复制开局信息……", () => {
      renderTransfer();
      showScreen("screen-transfer");
    });
  });
  document.getElementById("transferBack").addEventListener("click", () => showScreen("screen-colonists"));
  document.getElementById("regeneratePrompt").addEventListener("click", () => {
    renderTransfer();
    document.getElementById("copyStartupPrompt").textContent = "复制首轮提示词";
    showToast("已按当前设置重新生成。");
  });
  document.getElementById("copyStartupPrompt").addEventListener("click", copyStartupPrompt);

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

import type { CatalogCategory, CatalogProduct } from '~/composables/useCatalog'

type RNG = () => number

function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function int(rng: RNG, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function float(rng: RNG, min: number, max: number, digits = 1) {
  const v = rng() * (max - min) + min
  const m = 10 ** digits
  return Math.round(v * m) / m
}

function pick<T>(rng: RNG, list: T[]): T {
  if (!list.length) {
    throw new Error('pick(): empty list')
  }
  return list[int(rng, 0, list.length - 1)]!
}

function bool(rng: RNG, probability = 0.5) {
  return rng() < probability
}

function makeProducts(opts: {
  rng: RNG
  prefix: string
  baseName: string
  count: number
  specFactory: (i: number) => CatalogProduct['specs']
}): CatalogProduct[] {
  const { rng, prefix, baseName, count, specFactory } = opts
  const products: CatalogProduct[] = []
  for (let i = 1; i <= count; i++) {
    products.push({
      id: `${prefix}-${String(i).padStart(3, '0')}`,
      name: `${baseName} ${i}`,
      specs: specFactory(i),
    })
  }
  // Slightly shuffle for realism (stable with seed)
  for (let i = products.length - 1; i > 0; i--) {
    const j = int(rng, 0, i)
    const tmp = products[i]!
    products[i] = products[j]!
    products[j] = tmp
  }
  return products
}

function smartphoneSpecs(rng: RNG, kind: 'iphone' | 'android' | 'rugged'): CatalogProduct['specs'] {
  const screen = kind === 'iphone'
    ? float(rng, 6.1, 6.9, 1)
    : float(rng, 6.4, 6.9, 1)

  const ram = kind === 'iphone' ? pick(rng, [6, 8]) : pick(rng, [6, 8, 12, 16])
  const storage = kind === 'iphone' ? pick(rng, [128, 256, 512, 1024]) : pick(rng, [128, 256, 512])
  const battery = kind === 'rugged' ? int(rng, 6000, 12000) : int(rng, 4000, 5500)

  return {
    brand: kind === 'iphone' ? 'Apple' : pick(rng, ['Samsung', 'Xiaomi', 'OnePlus', 'Google', 'Motorola', 'Realme']),
    os: kind === 'iphone' ? 'iOS' : 'Android',
    screen_inch: screen,
    screen_type: pick(rng, kind === 'iphone' ? ['OLED'] : ['AMOLED', 'OLED', 'IPS']),
    resolution: pick(rng, ['2400×1080', '2560×1440', '2778×1284', '3200×1440']),
    refresh_hz: pick(rng, [60, 90, 120, 144]),
    ram_gb: ram,
    storage_gb: storage,
    chipset: pick(rng, ['Snapdragon 8 Gen 3', 'Dimensity 9300', 'A17 Pro', 'Tensor G3', 'Snapdragon 7+ Gen 3']),
    battery_mah: battery,
    main_camera_mp: pick(rng, [48, 50, 64, 108, 200]),
    ultra_wide_mp: pick(rng, [8, 12, 13, 16]),
    telephoto_mp: bool(rng, 0.5) ? pick(rng, [10, 12, 50]) : '—',
    selfie_mp: pick(rng, [12, 16, 32]),
    esim: bool(rng, kind === 'iphone' ? 0.9 : 0.4),
    ip_rating: kind === 'rugged' ? pick(rng, ['IP68', 'IP69K']) : pick(rng, ['IP54', 'IP67', 'IP68']),
    five_g: bool(rng, 0.75),
    charging_w: pick(rng, [20, 25, 33, 45, 65, 80, 120]),
    wireless_charging: bool(rng, kind === 'iphone' ? 0.9 : 0.45),
    weight_g: kind === 'rugged' ? int(rng, 240, 340) : int(rng, 165, 230),
  }
}

function tabletSpecs(rng: RNG, kind: 'ios' | 'android' | 'graphics'): CatalogProduct['specs'] {
  if (kind === 'graphics') {
    return {
      type: 'Graphics tablet',
      active_area_mm: `${int(rng, 160, 260)}×${int(rng, 100, 180)}`,
      pressure_levels: pick(rng, [4096, 8192]),
      tilt_support: bool(rng, 0.7),
      connection: pick(rng, ['USB‑C', 'USB‑C + Bluetooth']),
      pen_included: true,
      shortcut_keys: int(rng, 4, 12),
    }
  }

  const screen = kind === 'ios' ? float(rng, 10.9, 13.0, 1) : float(rng, 10.4, 12.4, 1)
  const ram = kind === 'ios' ? pick(rng, [8, 16]) : pick(rng, [6, 8, 12])
  const storage = pick(rng, [128, 256, 512, 1024])

  return {
    brand: kind === 'ios' ? 'Apple' : pick(rng, ['Samsung', 'Lenovo', 'Xiaomi', 'Huawei']),
    os: kind === 'ios' ? 'iPadOS' : 'Android',
    screen_inch: screen,
    resolution: pick(rng, ['2000×1200', '2560×1600', '2732×2048']),
    refresh_hz: pick(rng, [60, 90, 120]),
    ram_gb: ram,
    storage_gb: storage,
    battery_mah: int(rng, 7000, 11000),
    stylus_support: bool(rng, 0.85),
    keyboard_support: bool(rng, 0.8),
    lte_5g: bool(rng, 0.4),
    weight_g: int(rng, 450, 720),
  }
}

function laptopSpecs(rng: RNG, kind: 'gaming' | 'ultrabook' | 'study'): CatalogProduct['specs'] {
  const cpu = kind === 'gaming'
    ? pick(rng, ['Intel Core i7‑13620H', 'Intel Core i9‑13900H', 'AMD Ryzen 7 7840HS'])
    : pick(rng, ['Intel Core i5‑1340P', 'Intel Core i7‑1355U', 'AMD Ryzen 5 7640U', 'AMD Ryzen 7 7840U'])

  const screen = kind === 'ultrabook'
    ? float(rng, 13.3, 14.5, 1)
    : float(rng, 14.0, 16.1, 1)

  const ram = kind === 'study' ? pick(rng, [8, 16]) : pick(rng, [16, 32])
  const storage = kind === 'study' ? pick(rng, [256, 512]) : pick(rng, [512, 1024, 2048])

  const gpu = kind === 'gaming'
    ? pick(rng, ['NVIDIA GeForce RTX 4050', 'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4070'])
    : pick(rng, ['Intel Iris Xe', 'Intel Arc', 'Radeon 780M'])

  return {
    cpu,
    ram_gb: ram,
    ram_type: pick(rng, kind === 'ultrabook' ? ['LPDDR5', 'LPDDR5X'] : ['DDR5', 'LPDDR5']),
    storage_gb: storage,
    storage_type: 'NVMe SSD',
    screen_inch: screen,
    resolution: pick(rng, ['1920×1080', '1920×1200', '2560×1440', '2560×1600']),
    panel: pick(rng, ['IPS', 'OLED']),
    refresh_hz: kind === 'gaming' ? pick(rng, [120, 144, 165, 240]) : pick(rng, [60, 90, 120]),
    gpu,
    vram_gb: kind === 'gaming' ? pick(rng, [6, 8, 12]) : '—',
    battery_wh: int(rng, 45, 90),
    weight_kg: kind === 'ultrabook' ? float(rng, 1.1, 1.5, 2) : float(rng, 1.5, 2.6, 2),
    wifi: pick(rng, ['Wi‑Fi 6', 'Wi‑Fi 6E']),
    bluetooth: pick(rng, ['5.2', '5.3']),
    os: pick(rng, ['Windows 11', 'No OS', 'Linux']),
  }
}

function desktopSpecs(rng: RNG, kind: 'tower' | 'aio' | 'mini'): CatalogProduct['specs'] {
  const cpu = pick(rng, ['Intel Core i5‑14400F', 'Intel Core i7‑14700F', 'AMD Ryzen 5 7600', 'AMD Ryzen 7 7800X3D'])
  const ram = pick(rng, [16, 32, 64])
  const gpu = kind === 'aio'
    ? pick(rng, ['Integrated', 'GeForce RTX 3050'])
    : pick(rng, ['GeForce RTX 4060', 'GeForce RTX 4070', 'Radeon RX 7800 XT', 'Integrated'])

  return {
    type: kind === 'tower' ? 'System unit' : kind === 'aio' ? 'All‑in‑One' : 'Mini PC',
    cpu,
    ram_gb: ram,
    storage_primary: pick(rng, ['512GB NVMe SSD', '1TB NVMe SSD', '2TB NVMe SSD']),
    storage_secondary: bool(rng, 0.5) ? pick(rng, ['1TB HDD', '2TB HDD', '4TB HDD']) : '—',
    gpu,
    psu_w: kind === 'tower' ? pick(rng, [550, 650, 750, 850]) : pick(rng, [180, 230, 300]),
    wifi: bool(rng, 0.6),
    os: pick(rng, ['Windows 11', 'No OS']),
  }
}

function monitorSpecs(rng: RNG): CatalogProduct['specs'] {
  const size = pick(rng, [24, 27, 28, 32, 34])
  const resolution = size >= 32 ? pick(rng, ['3840×2160', '3440×1440']) : pick(rng, ['1920×1080', '2560×1440'])
  return {
    size_inch: size,
    resolution,
    panel: pick(rng, ['IPS', 'VA', 'OLED']),
    refresh_hz: pick(rng, [60, 75, 120, 144, 165, 240]),
    response_ms: pick(rng, [1, 2, 4, 5]),
    vesa: bool(rng, 0.8) ? '100×100' : '—',
    ports: pick(rng, ['HDMI×2, DisplayPort', 'HDMI, DisplayPort, USB‑C', 'HDMI×2']),
  }
}

function peripheralSpecs(rng: RNG, kind: 'mouse' | 'keyboard' | 'mousepad' | 'webcam'): CatalogProduct['specs'] {
  if (kind === 'mouse') {
    return {
      type: 'Mouse',
      connection: pick(rng, ['Wireless', 'Wired', 'Wireless + BT']),
      sensor: pick(rng, ['Optical', 'Optical (gaming)']),
      dpi: pick(rng, [8000, 12000, 26000]),
      weight_g: int(rng, 55, 110),
      buttons: int(rng, 5, 10),
    }
  }
  if (kind === 'keyboard') {
    return {
      type: 'Keyboard',
      switches: pick(rng, ['Membrane', 'Mechanical (Red)', 'Mechanical (Brown)', 'Mechanical (Blue)']),
      layout: pick(rng, ['US', 'RU', 'US/RU']),
      backlight: bool(rng, 0.75),
      connection: pick(rng, ['USB', 'Wireless', 'Wireless + BT']),
      size: pick(rng, ['Full‑size', 'TKL', '60%']),
    }
  }
  if (kind === 'mousepad') {
    return {
      type: 'Mousepad',
      size_mm: pick(rng, ['250×210', '450×400', '900×400']),
      thickness_mm: pick(rng, [2, 3, 4]),
      surface: pick(rng, ['Control', 'Speed']),
      stitched_edges: bool(rng, 0.6),
    }
  }
  return {
    type: 'Webcam',
    resolution: pick(rng, ['1920×1080', '2560×1440', '3840×2160']),
    fps: pick(rng, [30, 60]),
    autofocus: bool(rng, 0.65),
    mic: bool(rng, 0.9),
    connection: 'USB',
  }
}

function officeTechSpecs(rng: RNG, kind: 'printer' | 'scanner' | 'mfp' | 'cartridge'): CatalogProduct['specs'] {
  if (kind === 'cartridge') {
    return {
      type: 'Cartridge',
      color: pick(rng, ['Black', 'Cyan', 'Magenta', 'Yellow']),
      pages: int(rng, 700, 6000),
      compatible_with: pick(rng, ['LaserJet series', 'EcoTank series', 'DeskJet series']),
      original: bool(rng, 0.5),
    }
  }

  const technology = pick(rng, ['Laser', 'Inkjet'])
  const duplex = bool(rng, 0.55)
  const wifi = bool(rng, 0.65)
  const ppm = technology === 'Laser' ? int(rng, 18, 40) : int(rng, 10, 25)

  if (kind === 'scanner') {
    return {
      type: 'Scanner',
      max_format: pick(rng, ['A4', 'A3']),
      dpi: pick(rng, [1200, 2400, 4800]),
      adf: bool(rng, 0.55),
      speed_ppm: int(rng, 10, 30),
      connection: pick(rng, ['USB', 'USB + Wi‑Fi']),
    }
  }

  return {
    type: kind === 'mfp' ? 'MFP' : 'Printer',
    technology,
    color: bool(rng, 0.6),
    speed_ppm: ppm,
    duplex,
    wifi,
    max_format: 'A4',
  }
}

function pcPartSpecs(rng: RNG, kind: 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'ssd' | 'hdd' | 'external' | 'psu' | 'case' | 'cooling'): CatalogProduct['specs'] {
  if (kind === 'cpu') {
    const brand = pick(rng, ['Intel', 'AMD'])
    return {
      brand,
      socket: brand === 'Intel' ? pick(rng, ['LGA1700', 'LGA1851']) : pick(rng, ['AM5']),
      cores: int(rng, 6, 16),
      threads: pick(rng, [12, 16, 20, 24, 32]),
      base_ghz: float(rng, 2.8, 4.2, 1),
      boost_ghz: float(rng, 4.6, 5.7, 1),
      tdp_w: pick(rng, [65, 105, 125, 170]),
    }
  }
  if (kind === 'gpu') {
    return {
      chipset: pick(rng, ['NVIDIA GeForce RTX 4060', 'RTX 4070', 'RTX 4080', 'AMD Radeon RX 7800 XT', 'RX 7900 XT']),
      vram_gb: pick(rng, [8, 12, 16, 20]),
      memory_type: pick(rng, ['GDDR6', 'GDDR6X']),
      power_w: int(rng, 160, 350),
      length_mm: int(rng, 230, 340),
      outputs: pick(rng, ['HDMI + DP×3', 'HDMI×2 + DP×2']),
    }
  }
  if (kind === 'motherboard') {
    return {
      socket: pick(rng, ['AM5', 'LGA1700']),
      chipset: pick(rng, ['B650', 'X670', 'Z790', 'B760']),
      form_factor: pick(rng, ['ATX', 'mATX', 'Mini‑ITX']),
      ram_type: 'DDR5',
      m2_slots: int(rng, 2, 4),
      wifi: bool(rng, 0.5),
    }
  }
  if (kind === 'ram') {
    return {
      type: 'RAM',
      ram_type: pick(rng, ['DDR4', 'DDR5']),
      capacity_gb: pick(rng, [16, 32, 64]),
      kit: pick(rng, ['2×8', '2×16', '2×32']),
      speed_mhz: pick(rng, [3200, 3600, 5200, 6000]),
      latency: pick(rng, ['CL16', 'CL18', 'CL36', 'CL40']),
    }
  }
  if (kind === 'ssd') {
    return {
      type: 'SSD',
      interface: pick(rng, ['PCIe 4.0 NVMe', 'PCIe 5.0 NVMe', 'SATA']),
      capacity_gb: pick(rng, [500, 1000, 2000, 4000]),
      read_mbps: int(rng, 500, 7400),
      write_mbps: int(rng, 450, 6500),
      warranty_years: pick(rng, [3, 5]),
    }
  }
  if (kind === 'hdd') {
    return {
      type: 'HDD',
      capacity_gb: pick(rng, [1000, 2000, 4000, 8000]),
      rpm: pick(rng, [5400, 7200]),
      cache_mb: pick(rng, [128, 256]),
      interface: 'SATA',
      warranty_years: pick(rng, [2, 3]),
    }
  }
  if (kind === 'external') {
    return {
      type: 'External drive',
      capacity_gb: pick(rng, [1000, 2000, 4000]),
      interface: pick(rng, ['USB‑C 3.2', 'USB‑A 3.0']),
      drive_type: pick(rng, ['HDD', 'SSD']),
      weight_g: int(rng, 120, 420),
    }
  }
  if (kind === 'psu') {
    return {
      type: 'PSU',
      wattage_w: pick(rng, [550, 650, 750, 850, 1000]),
      efficiency: pick(rng, ['80+ Bronze', '80+ Gold', '80+ Platinum']),
      modular: pick(rng, ['Non‑modular', 'Semi‑modular', 'Full modular']),
      atx: pick(rng, ['ATX 2.4', 'ATX 3.0']),
      warranty_years: pick(rng, [5, 7, 10]),
    }
  }
  if (kind === 'case') {
    return {
      type: 'Case',
      form_factor: pick(rng, ['ATX', 'mATX', 'Mini‑ITX']),
      side_panel: pick(rng, ['Tempered glass', 'Metal']),
      fans_included: int(rng, 1, 4),
      max_gpu_mm: int(rng, 300, 410),
      rgb: bool(rng, 0.5),
    }
  }
  return {
    type: 'Cooling',
    kind: pick(rng, ['Air cooler', 'AIO liquid']),
    tdp_w: pick(rng, [150, 200, 250, 300]),
    noise_db: int(rng, 20, 38),
    rgb: bool(rng, 0.55),
    sockets: 'AM5/LGA1700',
  }
}

function tvSpecs(rng: RNG, kind: 'oled' | 'qled' | 'smart'): CatalogProduct['specs'] {
  const size = pick(rng, [43, 50, 55, 65, 75])
  const panel = kind === 'oled' ? 'OLED' : kind === 'qled' ? 'QLED' : pick(rng, ['LED', 'QLED'])
  return {
    size_inch: size,
    resolution: '3840×2160',
    panel,
    refresh_hz: pick(rng, [60, 120]),
    hdr: pick(rng, ['HDR10', 'HDR10+', 'Dolby Vision']),
    smart_tv: true,
    hdmi_ports: pick(rng, [3, 4]),
    vesa: '200×200',
  }
}

function audioSystemSpecs(rng: RNG, kind: 'soundbar' | 'home_theater' | 'music_center'): CatalogProduct['specs'] {
  if (kind === 'soundbar') {
    return {
      type: 'Soundbar',
      channels: pick(rng, ['2.1', '3.1', '5.1.2']),
      power_w: int(rng, 180, 600),
      subwoofer: bool(rng, 0.8),
      dolby_atmos: bool(rng, 0.5),
      inputs: pick(rng, ['HDMI eARC, Optical, Bluetooth', 'Optical, Bluetooth']),
    }
  }
  if (kind === 'home_theater') {
    return {
      type: 'Home theater',
      channels: pick(rng, ['5.1', '7.1', '5.1.2']),
      power_w: int(rng, 400, 1200),
      receiver_included: bool(rng, 0.6),
      inputs: 'HDMI, Optical, Bluetooth',
    }
  }
  return {
    type: 'Music center',
    power_w: int(rng, 80, 300),
    bluetooth: true,
    cd: bool(rng, 0.5),
    usb: true,
    radio: true,
  }
}

function headphonesSpecs(rng: RNG, kind: 'tws' | 'overear' | 'gaming'): CatalogProduct['specs'] {
  if (kind === 'tws') {
    return {
      type: 'TWS',
      connection: 'Bluetooth 5.3',
      anc: bool(rng, 0.7),
      battery_hours: int(rng, 18, 40),
      codecs: pick(rng, ['SBC, AAC', 'SBC, AAC, LDAC', 'SBC, AAC, LC3']),
      ip_rating: pick(rng, ['IPX4', 'IP55', 'IP57']),
    }
  }
  if (kind === 'overear') {
    return {
      type: 'Over‑ear',
      connection: pick(rng, ['Bluetooth 5.3', 'Wired 3.5mm', 'Bluetooth + 3.5mm']),
      anc: bool(rng, 0.6),
      battery_hours: int(rng, 20, 70),
      impedance_ohm: pick(rng, [16, 32, 64]),
      weight_g: int(rng, 190, 320),
    }
  }
  return {
    type: 'Gaming headset',
    connection: pick(rng, ['USB', '3.5mm', 'Wireless']),
    surround: bool(rng, 0.55),
    mic: true,
    weight_g: int(rng, 220, 360),
    rgb: bool(rng, 0.4),
  }
}

function portableSpeakerSpecs(rng: RNG): CatalogProduct['specs'] {
  return {
    type: 'Portable speaker',
    power_w: int(rng, 10, 120),
    battery_hours: int(rng, 8, 30),
    bluetooth: '5.3',
    ip_rating: pick(rng, ['IPX7', 'IP67']),
    stereo_pair: bool(rng, 0.6),
  }
}

function projectorSpecs(rng: RNG, kind: 'projector' | 'screen'): CatalogProduct['specs'] {
  if (kind === 'screen') {
    return {
      type: 'Screen',
      diagonal_inch: pick(rng, [84, 92, 100, 120]),
      aspect: pick(rng, ['16:9', '4:3']),
      material: pick(rng, ['Matte white', 'ALR']),
      mounting: pick(rng, ['Wall', 'Tripod', 'Ceiling']),
    }
  }
  return {
    type: 'Projector',
    resolution: pick(rng, ['1280×720', '1920×1080', '3840×2160']),
    brightness_lm: int(rng, 1500, 4000),
    contrast: pick(rng, ['10000:1', '15000:1', '20000:1']),
    throw: pick(rng, ['Short', 'Standard']),
    inputs: pick(rng, ['HDMI, USB', 'HDMI×2, USB']),
  }
}

function kitchenLargeSpecs(rng: RNG, kind: 'fridge' | 'freezer' | 'stove' | 'dishwasher'): CatalogProduct['specs'] {
  if (kind === 'fridge') {
    return {
      type: 'Refrigerator',
      volume_l: int(rng, 250, 450),
      freezer_volume_l: int(rng, 60, 150),
      no_frost: bool(rng, 0.8),
      energy_class: pick(rng, ['C', 'D', 'E']),
      noise_db: int(rng, 35, 42),
      height_cm: int(rng, 170, 205),
    }
  }
  if (kind === 'freezer') {
    return {
      type: 'Freezer',
      volume_l: int(rng, 150, 350),
      no_frost: bool(rng, 0.6),
      energy_class: pick(rng, ['C', 'D', 'E']),
      noise_db: int(rng, 36, 44),
    }
  }
  if (kind === 'stove') {
    return {
      type: 'Stove',
      cooktop: pick(rng, ['Gas', 'Electric', 'Induction']),
      oven_l: int(rng, 55, 75),
      width_cm: pick(rng, [50, 60]),
      convection: bool(rng, 0.6),
      energy_class: pick(rng, ['A', 'B']),
    }
  }
  return {
    type: 'Dishwasher',
    place_settings: int(rng, 9, 16),
    noise_db: int(rng, 42, 49),
    programs: int(rng, 5, 12),
    width_cm: pick(rng, [45, 60]),
    energy_class: pick(rng, ['A', 'B', 'C']),
  }
}

function kitchenBuiltInSpecs(rng: RNG, kind: 'hob' | 'oven' | 'hood'): CatalogProduct['specs'] {
  if (kind === 'hob') {
    return {
      type: 'Cooktop',
      kind: pick(rng, ['Induction', 'Electric', 'Gas']),
      zones: int(rng, 2, 5),
      width_cm: pick(rng, [30, 60, 75]),
      boost: bool(rng, 0.6),
    }
  }
  if (kind === 'oven') {
    return {
      type: 'Oven',
      volume_l: int(rng, 60, 78),
      programs: int(rng, 8, 18),
      pyrolysis: bool(rng, 0.35),
      steam: bool(rng, 0.4),
      energy_class: pick(rng, ['A', 'A+']),
    }
  }
  return {
    type: 'Hood',
    airflow_m3h: int(rng, 350, 900),
    noise_db: int(rng, 55, 72),
    width_cm: pick(rng, [60, 90]),
    filters: 'Aluminum',
    lighting: 'LED',
  }
}

function kitchenSmallSpecs(rng: RNG, kind: 'microwave' | 'kettle' | 'coffee' | 'toaster' | 'blender'): CatalogProduct['specs'] {
  if (kind === 'microwave') {
    return {
      type: 'Microwave',
      volume_l: int(rng, 20, 32),
      power_w: int(rng, 700, 1200),
      grill: bool(rng, 0.45),
      control: pick(rng, ['Mechanical', 'Touch']),
    }
  }
  if (kind === 'kettle') {
    return {
      type: 'Kettle',
      power_w: int(rng, 1800, 2400),
      capacity_l: float(rng, 1.5, 1.8, 1),
      temperature_control: bool(rng, 0.55),
      material: pick(rng, ['Plastic', 'Glass', 'Stainless steel']),
    }
  }
  if (kind === 'coffee') {
    return {
      type: 'Coffee machine',
      kind: pick(rng, ['Automatic', 'Capsule', 'Espresso']),
      pressure_bar: pick(rng, [15, 19]),
      milk_system: bool(rng, 0.6),
      water_tank_l: float(rng, 1.0, 1.8, 1),
    }
  }
  if (kind === 'toaster') {
    return {
      type: 'Toaster',
      slots: pick(rng, [2, 4]),
      power_w: int(rng, 700, 1100),
      browning_levels: int(rng, 6, 9),
      defrost: bool(rng, 0.7),
    }
  }
  return {
    type: 'Blender',
    power_w: int(rng, 500, 1500),
    bowl_l: float(rng, 0.6, 2.0, 1),
    speeds: int(rng, 2, 12),
    ice_crush: bool(rng, 0.55),
  }
}

function homeCareSpecs(rng: RNG, kind: 'vac_robot' | 'vac_stick' | 'vac_wet' | 'washer' | 'dryer' | 'ac' | 'heater' | 'humidifier' | 'iron' | 'steamer' | 'board'): CatalogProduct['specs'] {
  if (kind.startsWith('vac_')) {
    if (kind === 'vac_robot') {
      return {
        type: 'Robot vacuum',
        suction_pa: int(rng, 2500, 12000),
        battery_mah: int(rng, 3200, 6400),
        runtime_min: int(rng, 90, 220),
        mop: bool(rng, 0.75),
        mapping: pick(rng, ['LiDAR', 'Camera', 'Gyro']),
        dust_container_l: float(rng, 0.3, 0.6, 1),
      }
    }
    if (kind === 'vac_stick') {
      return {
        type: 'Stick vacuum',
        power_w: int(rng, 350, 700),
        battery_wh: int(rng, 150, 280),
        runtime_min: int(rng, 30, 70),
        weight_kg: float(rng, 2.4, 3.4, 1),
        hepa_filter: bool(rng, 0.8),
      }
    }
    return {
      type: 'Wet vacuum',
      power_w: int(rng, 500, 900),
      clean_water_l: float(rng, 0.6, 1.0, 1),
      dirty_water_l: float(rng, 0.4, 0.8, 1),
      self_clean: bool(rng, 0.65),
      weight_kg: float(rng, 3.5, 5.8, 1),
    }
  }

  if (kind === 'washer') {
    return {
      type: 'Washing machine',
      load_kg: int(rng, 7, 12),
      spin_rpm: pick(rng, [1200, 1400, 1600]),
      energy_class: pick(rng, ['A', 'B']),
      steam: bool(rng, 0.55),
      noise_db: int(rng, 72, 80),
    }
  }
  if (kind === 'dryer') {
    return {
      type: 'Dryer',
      load_kg: int(rng, 7, 10),
      heat_pump: bool(rng, 0.6),
      energy_class: pick(rng, ['A', 'B']),
      noise_db: int(rng, 63, 69),
    }
  }
  if (kind === 'ac') {
    return {
      type: 'Air conditioner',
      room_m2: int(rng, 15, 45),
      btu: pick(rng, [7000, 9000, 12000, 18000]),
      inverter: bool(rng, 0.7),
      noise_db: int(rng, 20, 45),
      wifi: bool(rng, 0.5),
    }
  }
  if (kind === 'heater') {
    return {
      type: 'Heater',
      power_w: pick(rng, [1000, 1500, 2000, 2500]),
      kind: pick(rng, ['Convector', 'Oil', 'Ceramic']),
      thermostat: bool(rng, 0.7),
      safety_shutdown: true,
    }
  }
  if (kind === 'humidifier') {
    return {
      type: 'Humidifier',
      tank_l: float(rng, 3, 6, 1),
      area_m2: int(rng, 20, 50),
      ultrasonic: bool(rng, 0.85),
      humidity_sensor: bool(rng, 0.6),
      night_mode: bool(rng, 0.5),
    }
  }
  if (kind === 'iron') {
    return {
      type: 'Iron',
      power_w: int(rng, 1800, 3000),
      steam_gmin: int(rng, 20, 60),
      anti_scale: bool(rng, 0.75),
      auto_off: true,
    }
  }
  if (kind === 'steamer') {
    return {
      type: 'Steamer',
      power_w: int(rng, 1500, 2400),
      steam_gmin: int(rng, 25, 70),
      tank_l: float(rng, 1.2, 2.2, 1),
      heat_up_s: int(rng, 30, 60),
    }
  }
  return {
    type: 'Ironing board',
    width_cm: int(rng, 35, 50),
    length_cm: int(rng, 110, 140),
    adjustable_height: true,
    iron_rest: bool(rng, 0.9),
  }
}

function gamingSpecs(rng: RNG, kind: 'ps' | 'xbox' | 'switch' | 'disc' | 'topup' | 'gamepad' | 'wheel' | 'vr' | 'chair' | 'desk'): CatalogProduct['specs'] {
  if (kind === 'ps' || kind === 'xbox' || kind === 'switch') {
    return {
      type: 'Console',
      platform: kind === 'ps' ? 'PlayStation' : kind === 'xbox' ? 'Xbox' : 'Nintendo Switch',
      storage_gb: pick(rng, [512, 1000, 2000]),
      resolution: '4K',
      fps: pick(rng, [60, 120]),
      ray_tracing: bool(rng, 0.7),
    }
  }
  if (kind === 'disc') {
    return {
      type: 'Game disc',
      platform: pick(rng, ['PlayStation', 'Xbox', 'Switch']),
      genre: pick(rng, ['Action', 'RPG', 'Racing', 'Shooter', 'Adventure']),
      age_rating: pick(rng, ['E', 'T', 'M', 'PEGI 12', 'PEGI 16', 'PEGI 18']),
    }
  }
  if (kind === 'topup') {
    return {
      type: 'Top‑up card',
      platform: pick(rng, ['PlayStation', 'Xbox', 'Nintendo']),
      value_eur: pick(rng, [10, 20, 50, 100]),
      region: pick(rng, ['EU', 'US']),
    }
  }
  if (kind === 'gamepad') {
    return {
      type: 'Gamepad',
      connection: pick(rng, ['Bluetooth', 'USB', 'Wireless dongle']),
      battery_hours: int(rng, 20, 60),
      vibration: true,
      compatibility: pick(rng, ['PC', 'Console', 'PC/Console']),
    }
  }
  if (kind === 'wheel') {
    return {
      type: 'Racing wheel',
      force_feedback: bool(rng, 0.8),
      rotation_deg: pick(rng, [270, 540, 900]),
      pedals: pick(rng, [2, 3]),
      compatibility: pick(rng, ['PC', 'PC/Console']),
    }
  }
  if (kind === 'vr') {
    return {
      type: 'VR headset',
      resolution_per_eye: pick(rng, ['1832×1920', '2064×2208', '2448×2448']),
      refresh_hz: pick(rng, [90, 120]),
      tracking: pick(rng, ['Inside‑out', 'Base stations']),
      storage_gb: pick(rng, [128, 256, 512]),
      weight_g: int(rng, 450, 650),
    }
  }
  if (kind === 'chair') {
    return {
      type: 'Gaming chair',
      max_weight_kg: pick(rng, [120, 150, 180]),
      material: pick(rng, ['PU leather', 'Fabric']),
      recline_deg: pick(rng, [135, 160, 180]),
      armrests: pick(rng, ['2D', '3D', '4D']),
    }
  }
  return {
    type: 'Gaming desk',
    width_cm: pick(rng, [120, 140, 160]),
    depth_cm: pick(rng, [60, 70, 80]),
    height_adjustable: bool(rng, 0.4),
    cable_management: bool(rng, 0.7),
  }
}

function photoVideoSpecs(rng: RNG, kind: 'dslr' | 'mirrorless' | 'instant' | 'camcorder' | 'action' | 'drone' | 'lens' | 'flash' | 'tripod'): CatalogProduct['specs'] {
  if (kind === 'dslr' || kind === 'mirrorless') {
    return {
      type: kind === 'dslr' ? 'DSLR camera' : 'Mirrorless camera',
      sensor: pick(rng, ['APS‑C', 'Full‑frame']),
      megapixels: pick(rng, [24, 26, 33, 45]),
      video: pick(rng, ['4K 60fps', '4K 30fps', '8K 30fps']),
      stabilization: bool(rng, 0.55),
      iso_max: pick(rng, [25600, 51200, 102400]),
    }
  }
  if (kind === 'instant') {
    return {
      type: 'Instant camera',
      film: pick(rng, ['Mini', 'Square']),
      flash: true,
      selfie_mirror: bool(rng, 0.8),
      battery: pick(rng, ['AA', 'Rechargeable']),
    }
  }
  if (kind === 'camcorder') {
    return {
      type: 'Camcorder',
      video: pick(rng, ['4K 30fps', 'Full HD 60fps']),
      zoom_optical: int(rng, 10, 30),
      stabilization: true,
      storage: 'SD card',
    }
  }
  if (kind === 'action') {
    return {
      type: 'Action camera',
      video: pick(rng, ['4K 60fps', '5.3K 60fps']),
      stabilization: true,
      waterproof_m: pick(rng, [10, 15]),
      battery_mah: int(rng, 1200, 1900),
    }
  }
  if (kind === 'drone') {
    return {
      type: 'Drone',
      flight_time_min: int(rng, 25, 45),
      range_km: float(rng, 6, 15, 1),
      camera: pick(rng, ['4K', '5.1K']),
      obstacle_avoidance: bool(rng, 0.7),
      weight_g: int(rng, 249, 900),
    }
  }
  if (kind === 'lens') {
    return {
      type: 'Lens',
      mount: pick(rng, ['Sony E', 'Canon RF', 'Nikon Z', 'FUJIFILM X']),
      focal_mm: pick(rng, ['16‑35', '24‑70', '70‑200', '35', '50', '85']),
      aperture: pick(rng, ['f/1.8', 'f/2.8', 'f/4']),
      stabilization: bool(rng, 0.4),
    }
  }
  if (kind === 'flash') {
    return {
      type: 'Flash',
      guide_number: int(rng, 35, 65),
      ttl: bool(rng, 0.7),
      recycle_s: float(rng, 1.5, 3.5, 1),
      battery: pick(rng, ['AA', 'Li‑ion']),
    }
  }
  return {
    type: 'Tripod',
    max_height_cm: int(rng, 130, 180),
    min_height_cm: int(rng, 15, 35),
    max_load_kg: float(rng, 3, 12, 1),
    material: pick(rng, ['Aluminum', 'Carbon fiber']),
  }
}

export function generateCatalog(seed = 20260430): CatalogCategory[] {
  const rng = mulberry32(seed)

  const make = (slug: string, name: string) => ({ slug, name, subcategories: [] as CatalogCategory['subcategories'] })
  const cat = {
    gadgets: make('smartphones-gadgets', 'Смартфоны и гаджеты'),
    computers: make('laptops-computers', 'Ноутбуки и компьютеры'),
    parts: make('pc-components', 'Комплектующие для ПК'),
    entertainment: make('tv-audio-video', 'ТВ, Аудио и Видео'),
    kitchen: make('kitchen-appliances', 'Техника для кухни'),
    home: make('home-appliances', 'Техника для дома'),
    games: make('games-entertainment', 'Игры и развлечения'),
    photo: make('photo-video', 'Фото и видеотехника'),
  }

  // 1. Smartphones & gadgets
  cat.gadgets.subcategories.push(
    {
      slug: 'smartphones',
      name: 'Смартфоны',
      products: [
        ...makeProducts({
          rng,
          prefix: 'iphone',
          baseName: 'iPhone',
          count: 18,
          specFactory: () => ({ smartphone_type: 'iPhone', ...smartphoneSpecs(rng, 'iphone') }),
        }),
        ...makeProducts({
          rng,
          prefix: 'android',
          baseName: 'Android Phone',
          count: 24,
          specFactory: () => ({ smartphone_type: 'Android', ...smartphoneSpecs(rng, 'android') }),
        }),
        ...makeProducts({
          rng,
          prefix: 'rugged',
          baseName: 'Rugged Phone',
          count: 10,
          specFactory: () => ({ smartphone_type: 'Защищённый', ...smartphoneSpecs(rng, 'rugged') }),
        }),
      ],
    },
    {
      slug: 'tablets',
      name: 'Планшеты',
      products: [
        ...makeProducts({
          rng,
          prefix: 'ipad',
          baseName: 'iPad',
          count: 10,
          specFactory: () => ({ tablet_type: 'iOS', ...tabletSpecs(rng, 'ios') }),
        }),
        ...makeProducts({
          rng,
          prefix: 'tab',
          baseName: 'Android Tablet',
          count: 14,
          specFactory: () => ({ tablet_type: 'Android', ...tabletSpecs(rng, 'android') }),
        }),
        ...makeProducts({
          rng,
          prefix: 'gtablet',
          baseName: 'Graphics Tablet',
          count: 12,
          specFactory: () => ({ tablet_type: 'Графический', ...tabletSpecs(rng, 'graphics') }),
        }),
      ],
    },
    {
      slug: 'wearables',
      name: 'Смарт‑часы и фитнес‑браслеты',
      products: [
        ...makeProducts({
          rng,
          prefix: 'watch',
          baseName: 'Smartwatch',
          count: 16,
          specFactory: () => ({
            wearable_type: 'Смарт‑часы',
            screen_inch: float(rng, 1.2, 1.9, 2),
            display: pick(rng, ['AMOLED', 'OLED']),
            gps: true,
            waterproof_atm: pick(rng, [3, 5, 10]),
            battery_days: int(rng, 5, 14),
            nfc: bool(rng, 0.6),
            sensors: 'HR, SpO2, accelerometer, gyro',
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'band',
          baseName: 'Fitness Band',
          count: 14,
          specFactory: () => ({
            wearable_type: 'Фитнес‑браслет',
            screen_inch: float(rng, 0.9, 1.7, 2),
            display: pick(rng, ['OLED', 'AMOLED']),
            gps: bool(rng, 0.35),
            waterproof_atm: 5,
            battery_days: int(rng, 10, 21),
            nfc: bool(rng, 0.3),
            sensors: 'HR, accelerometer',
          }),
        }),
      ],
    },
    { slug: 'e-readers', name: 'Электронные книги', products: makeProducts({ rng, prefix: 'ereader', baseName: 'E‑Reader', count: 10, specFactory: () => ({ screen_inch: float(rng, 6.0, 7.8, 1), screen: 'E‑Ink', backlight: true, storage_gb: pick(rng, [8, 16, 32]), waterproof: bool(rng, 0.4), battery_weeks: int(rng, 3, 8) }) }) },
    {
      slug: 'accessories',
      name: 'Аксессуары',
      products: [
        ...makeProducts({
          rng,
          prefix: 'case',
          baseName: 'Case',
          count: 22,
          specFactory: () => ({
            accessory_type: 'Чехол',
            material: pick(rng, ['TPU', 'Silicone', 'Leather']),
            compatible: pick(rng, ['Phones 6.1"', 'Phones 6.7"', 'Universal']),
            magsafe: bool(rng, 0.3),
            color: pick(rng, ['Black', 'Blue', 'Clear', 'Red']),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'glass',
          baseName: 'Screen Protector',
          count: 18,
          specFactory: () => ({
            accessory_type: 'Защитное стекло',
            hardness: pick(rng, ['9H', '8H']),
            thickness_mm: float(rng, 0.2, 0.5, 2),
            oleophobic: bool(rng, 0.8),
            compatible: pick(rng, ['6.1"', '6.4"', '6.7"']),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'pb',
          baseName: 'Power Bank',
          count: 16,
          specFactory: () => ({
            accessory_type: 'Power Bank',
            capacity_mah: pick(rng, [10000, 20000, 30000]),
            max_power_w: pick(rng, [18, 20, 30, 45, 65]),
            ports: pick(rng, ['USB‑C + USB‑A', 'USB‑C×2 + USB‑A']),
            pd: true,
            wireless: bool(rng, 0.35),
            weight_g: int(rng, 180, 560),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'charger',
          baseName: 'Charger',
          count: 16,
          specFactory: () => ({
            accessory_type: 'Зарядное устройство',
            power_w: pick(rng, [20, 30, 45, 65, 100]),
            ports: pick(rng, ['USB‑C', 'USB‑C×2', 'USB‑C + USB‑A']),
            pd: bool(rng, 0.9),
            pps: bool(rng, 0.6),
            gan: bool(rng, 0.45),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'cable',
          baseName: 'Cable',
          count: 24,
          specFactory: () => ({
            accessory_type: 'Кабель',
            type: pick(rng, ['USB‑C', 'USB‑C↔Lightning', 'USB‑A↔USB‑C', 'AUX 3.5mm', 'HDMI']),
            length_m: pick(rng, [1, 1.5, 2, 3]),
            fast_charge: bool(rng, 0.6),
            braided: bool(rng, 0.5),
          }),
        }),
      ],
    },
  )

  // 2. Laptops & computers
  cat.computers.subcategories.push(
    {
      slug: 'laptops',
      name: 'Ноутбуки',
      products: [
        ...makeProducts({ rng, prefix: 'lapg', baseName: 'Ноутбук', count: 14, specFactory: () => ({ laptop_type: 'Игровой', ...laptopSpecs(rng, 'gaming') }) }),
        ...makeProducts({ rng, prefix: 'lapu', baseName: 'Ноутбук', count: 14, specFactory: () => ({ laptop_type: 'Ультрабук', ...laptopSpecs(rng, 'ultrabook') }) }),
        ...makeProducts({ rng, prefix: 'laps', baseName: 'Ноутбук', count: 12, specFactory: () => ({ laptop_type: 'Для учебы', ...laptopSpecs(rng, 'study') }) }),
      ],
    },
    {
      slug: 'pcs',
      name: 'Компьютеры (ПК)',
      products: [
        ...makeProducts({ rng, prefix: 'pct', baseName: 'ПК', count: 12, specFactory: () => ({ pc_type: 'Системный блок', ...desktopSpecs(rng, 'tower') }) }),
        ...makeProducts({ rng, prefix: 'pca', baseName: 'ПК', count: 8, specFactory: () => ({ pc_type: 'Моноблок', ...desktopSpecs(rng, 'aio') }) }),
        ...makeProducts({ rng, prefix: 'pcm', baseName: 'ПК', count: 10, specFactory: () => ({ pc_type: 'Неттоп', ...desktopSpecs(rng, 'mini') }) }),
      ],
    },
    { slug: 'monitors', name: 'Мониторы', products: makeProducts({ rng, prefix: 'mon', baseName: 'Монитор', count: 20, specFactory: () => monitorSpecs(rng) }) },
    {
      slug: 'peripherals',
      name: 'Периферия',
      products: [
        ...makeProducts({ rng, prefix: 'mouse', baseName: 'Периферия', count: 18, specFactory: () => ({ peripheral_type: 'Мышь', ...peripheralSpecs(rng, 'mouse') }) }),
        ...makeProducts({ rng, prefix: 'kbd', baseName: 'Периферия', count: 18, specFactory: () => ({ peripheral_type: 'Клавиатура', ...peripheralSpecs(rng, 'keyboard') }) }),
        ...makeProducts({ rng, prefix: 'pad', baseName: 'Периферия', count: 14, specFactory: () => ({ peripheral_type: 'Коврик', ...peripheralSpecs(rng, 'mousepad') }) }),
        ...makeProducts({ rng, prefix: 'cam', baseName: 'Периферия', count: 12, specFactory: () => ({ peripheral_type: 'Веб‑камера', ...peripheralSpecs(rng, 'webcam') }) }),
      ],
    },
    {
      slug: 'office-tech',
      name: 'Оргтехника и расходники',
      products: [
        ...makeProducts({ rng, prefix: 'prn', baseName: 'Оргтехника', count: 10, specFactory: () => ({ office_type: 'Принтер', ...officeTechSpecs(rng, 'printer') }) }),
        ...makeProducts({ rng, prefix: 'scn', baseName: 'Оргтехника', count: 8, specFactory: () => ({ office_type: 'Сканер', ...officeTechSpecs(rng, 'scanner') }) }),
        ...makeProducts({ rng, prefix: 'mfp', baseName: 'Оргтехника', count: 10, specFactory: () => ({ office_type: 'МФУ', ...officeTechSpecs(rng, 'mfp') }) }),
        ...makeProducts({ rng, prefix: 'cart', baseName: 'Расходник', count: 16, specFactory: () => ({ office_type: 'Картридж', ...officeTechSpecs(rng, 'cartridge') }) }),
      ],
    },
  )

  // 3. PC components
  cat.parts.subcategories.push(
    { slug: 'cpu', name: 'Процессоры (CPU)', products: makeProducts({ rng, prefix: 'cpu', baseName: 'CPU', count: 16, specFactory: () => pcPartSpecs(rng, 'cpu') }) },
    { slug: 'gpu', name: 'Видеокарты (GPU)', products: makeProducts({ rng, prefix: 'gpu', baseName: 'GPU', count: 18, specFactory: () => pcPartSpecs(rng, 'gpu') }) },
    { slug: 'motherboards', name: 'Материнские платы', products: makeProducts({ rng, prefix: 'mb', baseName: 'Материнская плата', count: 14, specFactory: () => pcPartSpecs(rng, 'motherboard') }) },
    { slug: 'ram', name: 'Оперативная память (RAM)', products: makeProducts({ rng, prefix: 'ram', baseName: 'RAM', count: 14, specFactory: () => pcPartSpecs(rng, 'ram') }) },
    { slug: 'storage-ssd', name: 'Накопители: SSD', products: makeProducts({ rng, prefix: 'ssd', baseName: 'SSD', count: 16, specFactory: () => pcPartSpecs(rng, 'ssd') }) },
    { slug: 'storage-hdd', name: 'Накопители: HDD', products: makeProducts({ rng, prefix: 'hdd', baseName: 'HDD', count: 12, specFactory: () => pcPartSpecs(rng, 'hdd') }) },
    { slug: 'storage-external', name: 'Накопители: внешние диски', products: makeProducts({ rng, prefix: 'ext', baseName: 'Внешний диск', count: 12, specFactory: () => pcPartSpecs(rng, 'external') }) },
    { slug: 'psu', name: 'Блоки питания', products: makeProducts({ rng, prefix: 'psu', baseName: 'БП', count: 12, specFactory: () => pcPartSpecs(rng, 'psu') }) },
    { slug: 'cases', name: 'Корпуса', products: makeProducts({ rng, prefix: 'casepc', baseName: 'Корпус', count: 12, specFactory: () => pcPartSpecs(rng, 'case') }) },
    { slug: 'cooling', name: 'Системы охлаждения', products: makeProducts({ rng, prefix: 'cool', baseName: 'Охлаждение', count: 12, specFactory: () => pcPartSpecs(rng, 'cooling') }) },
  )

  // 4. TV, audio, video
  cat.entertainment.subcategories.push(
    {
      slug: 'tvs',
      name: 'Телевизоры',
      products: [
        ...makeProducts({ rng, prefix: 'tvo', baseName: 'TV', count: 10, specFactory: () => ({ tv_type: 'OLED', ...tvSpecs(rng, 'oled') }) }),
        ...makeProducts({ rng, prefix: 'tvq', baseName: 'TV', count: 10, specFactory: () => ({ tv_type: 'QLED', ...tvSpecs(rng, 'qled') }) }),
        ...makeProducts({ rng, prefix: 'tvs', baseName: 'TV', count: 10, specFactory: () => ({ tv_type: 'Smart TV', ...tvSpecs(rng, 'smart') }) }),
      ],
    },
    {
      slug: 'audio-systems',
      name: 'Аудиосистемы',
      products: [
        ...makeProducts({ rng, prefix: 'sb', baseName: 'Аудиосистема', count: 12, specFactory: () => ({ audio_system_type: 'Саундбар', ...audioSystemSpecs(rng, 'soundbar') }) }),
        ...makeProducts({ rng, prefix: 'ht', baseName: 'Аудиосистема', count: 8, specFactory: () => ({ audio_system_type: 'Домашний кинотеатр', ...audioSystemSpecs(rng, 'home_theater') }) }),
        ...makeProducts({ rng, prefix: 'mc', baseName: 'Аудиосистема', count: 10, specFactory: () => ({ audio_system_type: 'Музыкальный центр', ...audioSystemSpecs(rng, 'music_center') }) }),
      ],
    },
    {
      slug: 'headphones',
      name: 'Наушники и гарнитуры',
      products: [
        ...makeProducts({ rng, prefix: 'tws', baseName: 'Наушники', count: 18, specFactory: () => ({ headphones_type: 'TWS', ...headphonesSpecs(rng, 'tws') }) }),
        ...makeProducts({ rng, prefix: 'ovr', baseName: 'Наушники', count: 16, specFactory: () => ({ headphones_type: 'Полноразмерные', ...headphonesSpecs(rng, 'overear') }) }),
        ...makeProducts({ rng, prefix: 'gh', baseName: 'Гарнитура', count: 14, specFactory: () => ({ headphones_type: 'Игровые', ...headphonesSpecs(rng, 'gaming') }) }),
      ],
    },
    { slug: 'portable-speakers', name: 'Портативные колонки', products: makeProducts({ rng, prefix: 'pspk', baseName: 'Колонка', count: 14, specFactory: () => portableSpeakerSpecs(rng) }) },
    {
      slug: 'projection',
      name: 'Проекторы и экраны',
      products: [
        ...makeProducts({ rng, prefix: 'proj', baseName: 'Проектор', count: 10, specFactory: () => ({ projection_type: 'Проектор', ...projectorSpecs(rng, 'projector') }) }),
        ...makeProducts({ rng, prefix: 'scr', baseName: 'Экран', count: 8, specFactory: () => ({ projection_type: 'Экран', ...projectorSpecs(rng, 'screen') }) }),
      ],
    },
  )

  // 5. Kitchen appliances
  cat.kitchen.subcategories.push(
    {
      slug: 'large-appliances',
      name: 'Крупная техника',
      products: [
        ...makeProducts({ rng, prefix: 'kfr', baseName: 'Кухонная техника', count: 12, specFactory: () => ({ kitchen_large_type: 'Холодильник', ...kitchenLargeSpecs(rng, 'fridge') }) }),
        ...makeProducts({ rng, prefix: 'kfz', baseName: 'Кухонная техника', count: 10, specFactory: () => ({ kitchen_large_type: 'Морозильная камера', ...kitchenLargeSpecs(rng, 'freezer') }) }),
        ...makeProducts({ rng, prefix: 'kst', baseName: 'Кухонная техника', count: 10, specFactory: () => ({ kitchen_large_type: 'Плита', ...kitchenLargeSpecs(rng, 'stove') }) }),
        ...makeProducts({ rng, prefix: 'kdw', baseName: 'Кухонная техника', count: 10, specFactory: () => ({ kitchen_large_type: 'Посудомоечная машина', ...kitchenLargeSpecs(rng, 'dishwasher') }) }),
      ],
    },
    {
      slug: 'built-in',
      name: 'Встраиваемая техника',
      products: [
        ...makeProducts({ rng, prefix: 'hob', baseName: 'Встраиваемая техника', count: 12, specFactory: () => ({ kitchen_builtin_type: 'Варочная панель', ...kitchenBuiltInSpecs(rng, 'hob') }) }),
        ...makeProducts({ rng, prefix: 'oven', baseName: 'Встраиваемая техника', count: 10, specFactory: () => ({ kitchen_builtin_type: 'Духовой шкаф', ...kitchenBuiltInSpecs(rng, 'oven') }) }),
        ...makeProducts({ rng, prefix: 'hood', baseName: 'Встраиваемая техника', count: 10, specFactory: () => ({ kitchen_builtin_type: 'Вытяжка', ...kitchenBuiltInSpecs(rng, 'hood') }) }),
      ],
    },
    {
      slug: 'small-appliances',
      name: 'Мелкая техника',
      products: [
        ...makeProducts({ rng, prefix: 'mic', baseName: 'Мелкая техника', count: 12, specFactory: () => ({ kitchen_small_type: 'Микроволновая печь', ...kitchenSmallSpecs(rng, 'microwave') }) }),
        ...makeProducts({ rng, prefix: 'ket', baseName: 'Мелкая техника', count: 14, specFactory: () => ({ kitchen_small_type: 'Электрочайник', ...kitchenSmallSpecs(rng, 'kettle') }) }),
        ...makeProducts({ rng, prefix: 'cof', baseName: 'Мелкая техника', count: 12, specFactory: () => ({ kitchen_small_type: 'Кофемашина', ...kitchenSmallSpecs(rng, 'coffee') }) }),
        ...makeProducts({ rng, prefix: 'tst', baseName: 'Мелкая техника', count: 12, specFactory: () => ({ kitchen_small_type: 'Тостер', ...kitchenSmallSpecs(rng, 'toaster') }) }),
        ...makeProducts({ rng, prefix: 'bln', baseName: 'Мелкая техника', count: 12, specFactory: () => ({ kitchen_small_type: 'Блендер', ...kitchenSmallSpecs(rng, 'blender') }) }),
      ],
    },
  )

  // 6. Home appliances
  cat.home.subcategories.push(
    {
      slug: 'vacuums',
      name: 'Пылесосы',
      products: [
        ...makeProducts({ rng, prefix: 'vrob', baseName: 'Пылесос', count: 14, specFactory: () => ({ vacuum_type: 'Робот‑пылесос', ...homeCareSpecs(rng, 'vac_robot') }) }),
        ...makeProducts({ rng, prefix: 'vstk', baseName: 'Пылесос', count: 14, specFactory: () => ({ vacuum_type: 'Вертикальный', ...homeCareSpecs(rng, 'vac_stick') }) }),
        ...makeProducts({ rng, prefix: 'vwet', baseName: 'Пылесос', count: 12, specFactory: () => ({ vacuum_type: 'Моющий', ...homeCareSpecs(rng, 'vac_wet') }) }),
      ],
    },
    {
      slug: 'laundry',
      name: 'Стирка и сушка',
      products: [
        ...makeProducts({ rng, prefix: 'wash', baseName: 'Техника для стирки', count: 12, specFactory: () => ({ laundry_type: 'Стиральная машина', ...homeCareSpecs(rng, 'washer') }) }),
        ...makeProducts({ rng, prefix: 'dry', baseName: 'Техника для стирки', count: 10, specFactory: () => ({ laundry_type: 'Сушильная машина', ...homeCareSpecs(rng, 'dryer') }) }),
      ],
    },
    {
      slug: 'climate',
      name: 'Климатическая техника',
      products: [
        ...makeProducts({ rng, prefix: 'ac', baseName: 'Климат', count: 12, specFactory: () => ({ climate_type: 'Кондиционер', ...homeCareSpecs(rng, 'ac') }) }),
        ...makeProducts({ rng, prefix: 'heat', baseName: 'Климат', count: 12, specFactory: () => ({ climate_type: 'Обогреватель', ...homeCareSpecs(rng, 'heater') }) }),
        ...makeProducts({ rng, prefix: 'hum', baseName: 'Климат', count: 12, specFactory: () => ({ climate_type: 'Увлажнитель', ...homeCareSpecs(rng, 'humidifier') }) }),
      ],
    },
    {
      slug: 'clothes-care',
      name: 'Уход за одеждой',
      products: [
        ...makeProducts({ rng, prefix: 'iron', baseName: 'Уход за одеждой', count: 12, specFactory: () => ({ clothes_care_type: 'Утюг', ...homeCareSpecs(rng, 'iron') }) }),
        ...makeProducts({ rng, prefix: 'steam', baseName: 'Уход за одеждой', count: 12, specFactory: () => ({ clothes_care_type: 'Отпариватель', ...homeCareSpecs(rng, 'steamer') }) }),
        ...makeProducts({ rng, prefix: 'board', baseName: 'Уход за одеждой', count: 10, specFactory: () => ({ clothes_care_type: 'Гладильная доска', ...homeCareSpecs(rng, 'board') }) }),
      ],
    },
  )

  // 7. Games & entertainment
  cat.games.subcategories.push(
    {
      slug: 'consoles',
      name: 'Игровые консоли',
      products: [
        ...makeProducts({ rng, prefix: 'ps', baseName: 'Консоль', count: 6, specFactory: () => ({ console_type: 'PlayStation', ...gamingSpecs(rng, 'ps') }) }),
        ...makeProducts({ rng, prefix: 'xb', baseName: 'Консоль', count: 6, specFactory: () => ({ console_type: 'Xbox', ...gamingSpecs(rng, 'xbox') }) }),
        ...makeProducts({ rng, prefix: 'sw', baseName: 'Консоль', count: 6, specFactory: () => ({ console_type: 'Nintendo Switch', ...gamingSpecs(rng, 'switch') }) }),
      ],
    },
    {
      slug: 'games',
      name: 'Игры и подписки',
      products: [
        ...makeProducts({ rng, prefix: 'game', baseName: 'Игра', count: 20, specFactory: () => ({ game_type: 'Диск', ...gamingSpecs(rng, 'disc') }) }),
        ...makeProducts({ rng, prefix: 'topup', baseName: 'Карта оплаты', count: 18, specFactory: () => ({ game_type: 'Карта оплаты', ...gamingSpecs(rng, 'topup') }) }),
      ],
    },
    {
      slug: 'console-accessories',
      name: 'Аксессуары для консолей',
      products: [
        ...makeProducts({ rng, prefix: 'gpad', baseName: 'Аксессуар', count: 14, specFactory: () => ({ console_accessory_type: 'Геймпад', ...gamingSpecs(rng, 'gamepad') }) }),
        ...makeProducts({ rng, prefix: 'wheel', baseName: 'Аксессуар', count: 10, specFactory: () => ({ console_accessory_type: 'Руль', ...gamingSpecs(rng, 'wheel') }) }),
        ...makeProducts({ rng, prefix: 'vr', baseName: 'Аксессуар', count: 10, specFactory: () => ({ console_accessory_type: 'VR‑шлем', ...gamingSpecs(rng, 'vr') }) }),
      ],
    },
    {
      slug: 'gaming-furniture',
      name: 'Игровая мебель',
      products: [
        ...makeProducts({ rng, prefix: 'chair', baseName: 'Мебель', count: 12, specFactory: () => ({ furniture_type: 'Кресло', ...gamingSpecs(rng, 'chair') }) }),
        ...makeProducts({ rng, prefix: 'desk', baseName: 'Мебель', count: 10, specFactory: () => ({ furniture_type: 'Стол', ...gamingSpecs(rng, 'desk') }) }),
      ],
    },
  )

  // 8. Photo & video
  cat.photo.subcategories.push(
    {
      slug: 'cameras',
      name: 'Фотоаппараты',
      products: [
        ...makeProducts({
          rng,
          prefix: 'dslr',
          baseName: 'Фотоаппарат (зеркалка)',
          count: 10,
          specFactory: () => ({
            camera_type: 'Зеркалка',
            ...photoVideoSpecs(rng, 'dslr'),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'ml',
          baseName: 'Фотоаппарат (беззеркальный)',
          count: 12,
          specFactory: () => ({
            camera_type: 'Беззеркальный',
            ...photoVideoSpecs(rng, 'mirrorless'),
          }),
        }),
        ...makeProducts({
          rng,
          prefix: 'inst',
          baseName: 'Фотоаппарат (моментальная печать)',
          count: 10,
          specFactory: () => ({
            camera_type: 'Моментальная печать',
            ...photoVideoSpecs(rng, 'instant'),
          }),
        }),
      ],
    },
    { slug: 'video-camcorders', name: 'Видеокамеры', products: makeProducts({ rng, prefix: 'camc', baseName: 'Camcorder', count: 8, specFactory: () => photoVideoSpecs(rng, 'camcorder') }) },
    { slug: 'video-action', name: 'Экшн‑камеры', products: makeProducts({ rng, prefix: 'act', baseName: 'Action Cam', count: 12, specFactory: () => photoVideoSpecs(rng, 'action') }) },
    { slug: 'drones', name: 'Квадрокоптеры (дроны)', products: makeProducts({ rng, prefix: 'drn', baseName: 'Drone', count: 10, specFactory: () => photoVideoSpecs(rng, 'drone') }) },
    { slug: 'optics-lenses', name: 'Оптика: объективы', products: makeProducts({ rng, prefix: 'lens', baseName: 'Lens', count: 16, specFactory: () => photoVideoSpecs(rng, 'lens') }) },
    { slug: 'optics-flashes', name: 'Оптика: вспышки', products: makeProducts({ rng, prefix: 'flash', baseName: 'Flash', count: 10, specFactory: () => photoVideoSpecs(rng, 'flash') }) },
    { slug: 'optics-tripods', name: 'Оптика: штативы', products: makeProducts({ rng, prefix: 'tri', baseName: 'Tripod', count: 12, specFactory: () => photoVideoSpecs(rng, 'tripod') }) },
  )

  return [
    cat.gadgets,
    cat.computers,
    cat.parts,
    cat.entertainment,
    cat.kitchen,
    cat.home,
    cat.games,
    cat.photo,
  ]
}


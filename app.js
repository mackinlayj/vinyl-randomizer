const STORAGE_KEYS = {
  config: 'vinyl-config',
  records: 'vinyl-records',
};

const state = {
  records: [],
  crateRecords: [],
  crateIndex: 0,
  selectedGenre: 'all',
  librarySearch: '',
  randomRecord: null,
  config: null,
};

const demoRecords = [
  {
    id: 101,
    artist: 'The Beatles',
    title: 'Abbey Road',
    year: 1969,
    genres: ['Rock', 'Pop'],
    image: 'https://images.vice.com/vice/images/articles/meta/2013/11/15/abbey-road-1384548667.jpg?crop=1xw:1xh;center,center&resize=900:*',
  },
  {
    id: 102,
    artist: 'Miles Davis',
    title: 'Kind of Blue',
    year: 1959,
    genres: ['Jazz'],
    image: 'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg',
  },
  {
    id: 103,
    artist: 'Daft Punk',
    title: 'Random Access Memories',
    year: 2013,
    genres: ['Electronic', 'Funk'],
    image: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
  },
  {
    id: 104,
    artist: 'Nina Simone',
    title: 'Pastel Blues',
    year: 1965,
    genres: ['Soul', 'Jazz'],
    image: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Ninasimone_pastelblues.jpg',
  },
  {
    id: 105,
    artist: 'Radiohead',
    title: 'OK Computer',
    year: 1997,
    genres: ['Alternative Rock'],
    image: 'https://upload.wikimedia.org/wikipedia/en/b/b8/Radioheadokcomputer.png',
  },
  {
    id: 106,
    artist: 'Nas',
    title: 'Illmatic',
    year: 1994,
    genres: ['Hip Hop'],
    image: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Illmatic.jpg',
  },
];

const $ = (selector) => document.querySelector(selector);

const showPage = (pageId) => {
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === pageId));
  document.querySelectorAll('.tab-button').forEach((button) => button.classList.toggle('active', button.dataset.page === pageId));
};

const getStoredConfig = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.config) || 'null');
  } catch {
    return null;
  }
};

const saveConfig = (config) => {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  state.config = config;
};

const normalizeSavedRecords = (records) =>
  records.map((record) => ({
    ...record,
    image: getImageUrl(record),
  }));

const getStoredRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.records);
    return raw ? normalizeSavedRecords(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

const saveRecords = (records) => {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(normalizeSavedRecords(records)));
};

const fallbackImage = 'https://placehold.co/900x900/17121f/f6efe9?text=Vinyl';

const getImageCandidates = (record) => {
  const direct = [
    record?.image,
    record?.cover_image,
    record?.thumb,
    record?.images?.[0]?.resource_url,
    record?.images?.[0]?.uri,
    record?.basic_information?.cover_image,
    record?.basic_information?.thumb,
    record?.release?.cover_image,
    record?.release?.thumb,
  ];

  const fromNested = (record?.release?.images || []).map((img) => img?.resource_url || img?.uri);
  return [...direct, ...fromNested].filter((value) => typeof value === 'string' && value.trim().length > 0);
};

const getImageUrl = (record) => {
  const candidates = getImageCandidates(record);
  const valid = candidates.find((value) => /^https?:\/\//i.test(value));
  return valid || fallbackImage;
};

const mountImage = (imageElement, record) => {
  imageElement.src = getImageUrl(record);
  imageElement.onerror = () => {
    imageElement.src = fallbackImage;
    imageElement.onerror = null;
  };
};

const sortRecordsByArtist = (records) =>
  [...records].sort((a, b) => {
    const artistCompare = getDisplayArtist(a).localeCompare(getDisplayArtist(b));
    if (artistCompare !== 0) {
      return artistCompare;
    }
    return getDisplayTitle(a).localeCompare(getDisplayTitle(b));
  });

const getDisplayTitle = (record) => record.title || 'Untitled album';
const getDisplayArtist = (record) => record.artist || 'Unknown artist';
const getDisplayGenres = (record) => {
  if (!record.genres || !record.genres.length) return ['Unknown'];
  return Array.isArray(record.genres) ? record.genres : [record.genres];
};
const getDisplayYear = (record) => record.year || '—';

const normalizeRecord = (item) => {
  const release = item.release || item;
  const images = release.images || [];
  const image = images.find((img) => img.type === 'primary' || img.type === 'secondary') || images[0];
  const recordImage = release.basic_information?.cover_image || release.cover_image || release.thumb || release.basic_information?.thumb || image?.uri || image?.resource_url || fallbackImage;

  return {
    id: release.id || item.id,
    artist: release.artists?.[0]?.name || release.basic_information?.artists?.[0]?.name || 'Unknown artist',
    title: release.title || release.basic_information?.title || 'Untitled album',
    year: release.year || release.basic_information?.year || '—',
    genres: release.genres?.length ? release.genres : (release.basic_information?.genres || ['Unknown']),
    styles: release.styles || release.basic_information?.styles || [],
    image: recordImage,
  };
};

const buildDemoRecords = () => demoRecords.map((record) => ({ ...record }));

const updateLibraryMeta = () => {
  const count = state.records.length;
  $('#libraryCount').textContent = `${count} record${count === 1 ? '' : 's'}`;
};

const uniqueGenres = (records) => {
  const values = new Set();
  records.forEach((record) => {
    getDisplayGenres(record).forEach((genre) => values.add(genre));
  });
  return [...values].sort((a, b) => a.localeCompare(b));
};

const renderGenreOptions = () => {
  const genres = uniqueGenres(state.records);
  const selects = [$('#libraryGenreFilter'), $('#crateGenreFilter')];

  selects.forEach((select) => {
    const currentValue = select.value || 'all';
    select.innerHTML = '<option value="all">All genres</option>';
    genres.forEach((genre) => {
      const option = document.createElement('option');
      option.value = genre;
      option.textContent = genre;
      select.appendChild(option);
    });
    select.value = genres.includes(currentValue) ? currentValue : 'all';
  });
};

const renderLibrary = () => {
  let filtered = sortRecordsByArtist(state.records);

  if (state.selectedGenre !== 'all') {
    filtered = filtered.filter((record) => getDisplayGenres(record).includes(state.selectedGenre));
  }

  if (state.librarySearch) {
    const query = state.librarySearch.toLowerCase();
    filtered = filtered.filter((record) => {
      const haystack = `${getDisplayArtist(record)} ${getDisplayTitle(record)}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  const grid = $('#libraryList');
  grid.innerHTML = '';

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state">No records match the current filter.</div>';
    updateLibraryMeta();
    return;
  }

  filtered.forEach((record) => {
    const card = document.createElement('article');
    card.className = 'record-card';
    const image = document.createElement('img');
    image.alt = `${getDisplayTitle(record)} by ${getDisplayArtist(record)}`;
    image.loading = 'lazy';
    mountImage(image, record);

    const body = document.createElement('div');
    body.className = 'record-body';
    body.innerHTML = `
      <p class="artist">${getDisplayArtist(record)}</p>
      <h3>${getDisplayTitle(record)}</h3>
      <div class="meta-row">
        <span>${getDisplayYear(record)}</span>
        <span>${getDisplayGenres(record).slice(0, 2).join(', ')}</span>
      </div>
    `;

    card.appendChild(image);
    card.appendChild(body);
    grid.appendChild(card);
  });

  updateLibraryMeta();
};

const getFilteredCrate = () => {
  let records = sortRecordsByArtist(state.records);
  if (state.selectedGenre !== 'all') {
    records = records.filter((record) => getDisplayGenres(record).includes(state.selectedGenre));
  }
  return records;
};

const renderCrate = () => {
  const filtered = getFilteredCrate();
  const filteredIds = new Set(filtered.map((record) => record.id));
  const shouldPreserveOrder = state.crateRecords.length > 0 && state.crateRecords.every((record) => filteredIds.has(record.id));
  const crateRecords = shouldPreserveOrder ? state.crateRecords.filter((record) => filteredIds.has(record.id)) : filtered;
  state.crateRecords = crateRecords;

  if (!crateRecords.length) {
    $('#crateCard').style.display = 'none';
    return;
  }

  $('#crateCard').style.display = 'grid';
  if (state.crateIndex >= crateRecords.length) {
    state.crateIndex = 0;
  }

  const current = crateRecords[state.crateIndex];
  mountImage($('#crateImage'), current);
  $('#crateImage').alt = `${getDisplayTitle(current)} by ${getDisplayArtist(current)}`;
  $('#crateArtist').textContent = getDisplayArtist(current);
  $('#crateTitle').textContent = getDisplayTitle(current);
  $('#crateYear').textContent = String(getDisplayYear(current));
  $('#crateGenre').textContent = getDisplayGenres(current).join(', ');
};

const renderRandomCard = () => {
  const record = state.randomRecord;
  if (!record) {
    $('#randomImage').src = fallbackImage;
    $('#randomArtist').textContent = 'Waiting';
    $('#randomTitle').textContent = 'Press randomize to spin your collection';
    $('#randomYear').textContent = '—';
    $('#randomGenre').textContent = '—';
    return;
  }

  mountImage($('#randomImage'), record);
  $('#randomImage').alt = `${getDisplayTitle(record)} by ${getDisplayArtist(record)}`;
  $('#randomArtist').textContent = getDisplayArtist(record);
  $('#randomTitle').textContent = getDisplayTitle(record);
  $('#randomYear').textContent = String(getDisplayYear(record));
  $('#randomGenre').textContent = getDisplayGenres(record).join(', ');
};

const randomizeCatalog = () => {
  if (!state.records.length) return;
  const next = state.records[Math.floor(Math.random() * state.records.length)];
  state.randomRecord = next;
  renderRandomCard();
};

const shuffleCrate = () => {
  if (!state.crateRecords.length) return;
  for (let i = state.crateRecords.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.crateRecords[i], state.crateRecords[j]] = [state.crateRecords[j], state.crateRecords[i]];
  }
  state.crateIndex = 0;
  renderCrate();
};

const sortCrate = () => {
  const records = sortRecordsByArtist(getFilteredCrate());
  state.crateRecords = records;
  state.crateIndex = 0;
  renderCrate();
};

const cycleCrate = (direction) => {
  const records = state.crateRecords.length ? state.crateRecords : getFilteredCrate();
  if (!records.length) return;
  state.crateIndex = (state.crateIndex + direction + records.length) % records.length;
  renderCrate();
};

const setGenreFilter = (genre, source) => {
  state.selectedGenre = genre;
  state.crateIndex = 0;
  if (source === 'library') {
    $('#crateGenreFilter').value = genre;
  } else {
    $('#libraryGenreFilter').value = genre;
  }
  renderLibrary();
  renderCrate();
};

const fetchCollection = async (username, token) => {
  const headers = {
    Authorization: `Discogs token ${token}`,
    'User-Agent': 'VinylRandomizer/1.0 (+https://example.com)',
    Accept: 'application/json',
  };

  const allRecords = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(`https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page}&per_page=100`, { headers });
    if (!response.ok) {
      throw new Error(`Discogs request failed: ${response.status}`);
    }

    const data = await response.json();
    const releases = data.releases || [];
    releases.forEach((item) => allRecords.push(normalizeRecord(item)));

    const total = Number(data.pagination?.pages || 1);
    totalPages = total;
    page += 1;
  }

  const sortedRecords = sortRecordsByArtist(allRecords);
  saveRecords(sortedRecords);
  state.records = sortedRecords;
  state.selectedGenre = 'all';
  renderGenreOptions();
  renderLibrary();
  renderCrate();
};

const openSettings = () => {
  const modal = $('#settingsModal');
  const config = getStoredConfig();
  $('#discogsUsername').value = config?.username || '';
  $('#discogsToken').value = config?.token || '';
  modal.showModal();
};

const closeSettings = () => {
  $('#settingsModal').close();
};

const loadLibrary = async () => {
  state.config = getStoredConfig();
  const savedRecords = getStoredRecords();

  if (savedRecords.length) {
    state.records = sortRecordsByArtist(savedRecords);
    renderGenreOptions();
    renderLibrary();
    renderCrate();
  }

  if (!state.config?.username || !state.config?.token) {
    openSettings();
    return;
  }

  try {
    await fetchCollection(state.config.username, state.config.token);
  } catch (error) {
    console.warn('Discogs fetch failed, using demo data instead.', error);
    state.records = sortRecordsByArtist(buildDemoRecords());
    saveRecords(state.records);
    renderGenreOptions();
    renderLibrary();
    renderCrate();
  }
};

const setupFormSubmit = async (event) => {
  event.preventDefault();
  const username = $('#discogsUsername').value.trim();
  const token = $('#discogsToken').value.trim();

  if (!username || !token) {
    return;
  }

  const config = { username, token };
  saveConfig(config);
  closeSettings();
  await fetchCollection(username, token).catch(() => {
    state.records = sortRecordsByArtist(buildDemoRecords());
    saveRecords(state.records);
    renderGenreOptions();
    renderLibrary();
    renderCrate();
  });
};

const useDemoData = () => {
  state.records = sortRecordsByArtist(buildDemoRecords());
  saveRecords(state.records);
  saveConfig({ username: 'demo-user', token: 'demo-token' });
  renderGenreOptions();
  renderLibrary();
  renderCrate();
  closeSettings();
};

const setupListeners = () => {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.page));
  });

  $('#settingsButton').addEventListener('click', openSettings);
  $('#closeModalButton').addEventListener('click', closeSettings);
  $('#settingsForm').addEventListener('submit', setupFormSubmit);
  $('#loadDemoButton').addEventListener('click', useDemoData);

  $('#librarySearch').addEventListener('input', (event) => {
    state.librarySearch = event.target.value.trim();
    renderLibrary();
  });

  $('#libraryGenreFilter').addEventListener('change', (event) => {
    state.selectedGenre = event.target.value;
    renderLibrary();
    renderCrate();
  });

  $('#crateGenreFilter').addEventListener('change', (event) => {
    setGenreFilter(event.target.value, 'crate');
  });

  $('#shuffleCrateButton').addEventListener('click', shuffleCrate);
  $('#sortCrateButton').addEventListener('click', sortCrate);
  $('#prevCrateButton').addEventListener('click', () => cycleCrate(-1));
  $('#nextCrateButton').addEventListener('click', () => cycleCrate(1));
  $('#randomizeButton').addEventListener('click', randomizeCatalog);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') cycleCrate(1);
    if (event.key === 'ArrowLeft') cycleCrate(-1);
  });
};

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  renderGenreOptions();
  renderLibrary();
  renderCrate();
  renderRandomCard();
  loadLibrary();
  registerServiceWorker();
});

document.addEventListener('DOMContentLoaded', () => {
  if (typeof galleryData !== 'undefined') {
    initGallery();
  }
});

function initGallery() {
  const itemsPerPage = 45;
  let currentPage = 1;
  let searchTerm = "";
  let selectedLinks = new Set();
  let filteredData = [...galleryData];

  function createFilters() {
    const actress = new Set();
    const director = new Set();
    const maker = new Set();
    const series = new Set();
    const label = new Set();
    const keyword = new Set();

    galleryData.forEach(item => {
      item.actress.forEach(name => actress.add(name));
      item.director.forEach(name => director.add(name));
      item.maker.forEach(name => maker.add(name));
      item.series.forEach(name => series.add(name));
      item.label.forEach(name => label.add(name));
      item.keyword.forEach(name => keyword.add(name));
    });

    function createCheckbox(value, group) {
      const safeValue = value.replace(/\W/g, '');
      return `<div class='form-check'>
        <input class='form-check-input' type='checkbox' value='${value}' data-group='${group}' id='chk-${group}-${safeValue}'>
        <label class='form-check-label' for='chk-${group}-${safeValue}'>${value}</label>
      </div>`;
    }

    document.getElementById('filterActressBody').innerHTML += [...actress].sort().map(v => createCheckbox(v, "actress")).join("");
    document.getElementById('filterDirectorBody').innerHTML += [...director].sort().map(v => createCheckbox(v, "director")).join("");
    document.getElementById('filterMakerBody').innerHTML += [...maker].sort().map(v => createCheckbox(v, "maker")).join("");
    document.getElementById('filterSeriesBody').innerHTML += [...series].sort().map(v => createCheckbox(v, "series")).join("");
    document.getElementById('filterLabelBody').innerHTML += [...label].sort().map(v => createCheckbox(v, "label")).join("");
    document.getElementById('filterKeywordBody').innerHTML += [...keyword].sort().map(v => createCheckbox(v, "keyword")).join("");
  }

  function applyFilters() {
    const checked = Array.from(document.querySelectorAll('.form-check-input:checked'));
    const active = { actress: [], director: [], maker: [], series: [], label: [], keyword: [] };

    checked.forEach(cb => {
      if (cb.dataset.group && active[cb.dataset.group]) {
        active[cb.dataset.group].push(cb.value);
      }
    });

    filteredData = galleryData.filter(item => {
      const matchActress = !active.actress.length || active.actress.some(v => item.actress.includes(v));
      const matchDirector = !active.director.length || active.director.some(v => item.director.includes(v));
      const matchMaker = !active.maker.length || active.maker.some(v => item.maker.includes(v));
      const matchSeries = !active.series.length || active.series.some(v => item.series.includes(v));
      const matchLabel = !active.label.length || active.label.some(v => item.label.includes(v));
      const matchKeyword = !active.keyword.length || active.keyword.some(v => item.keyword.includes(v));
      const matchSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm);
      return matchActress && matchDirector && matchMaker && matchSeries && matchLabel && matchKeyword && matchSearch;
    });

    renderGalleryPage(1);
  }

  function renderPagination() {
    const pagination = document.getElementById('paginationControls');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const createBtn = (page, text, active = false) => {
      return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'} mx-1" onclick="goToPage(${page})">${text}</button>`;
    };

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      pagination.innerHTML += createBtn(i, i, i === currentPage);
    }
  }

  window.goToPage = function(page) {
    currentPage = page;
    renderGalleryPage(currentPage);
    window.scrollTo({top: 0, behavior: 'instant'});
  };

  function renderGalleryPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = filteredData.slice(start, end).map((item, index) => {
      const id = `item-${item.id}-${index}`;
      return `
        <div class="col-md-4 mb-4">
          <div class="card h-100 ${selectedLinks.has(item.seed_download_link) ? 'selected-card' : ''}">
            <img src="${item.preview_img_url}" class="card-img-top" alt="${item.title}">
            <div class="card-body d-flex flex-column">
              <div class="form-check mb-2">
                <input class="form-check-input select-item" type="checkbox" value="${item.seed_download_link}" id="${id}" ${selectedLinks.has(item.seed_download_link) ? 'checked' : ''}>
                <label class="form-check-label fw-semibold text-dark" for="${id}" style="cursor:pointer;">${item.title}</label>
              </div>
              <small class="text-muted">${item.sell_date} | Size: ${item.size} | Duration: ${item.duration}</small>
              <p><strong>Actress:</strong> ${item.actress.slice(0,3).join(', ')}${item.actress.length > 3 ? " ..." : ""}</p>
            </div>
          </div>
        </div>`;
    }).join('');

    updateItemCount();
    monitorSelection();
    renderPagination();
  }

  function updateItemCount() {
    const count = selectedLinks.size;
    const btn = document.getElementById('exportBtn');
    document.getElementById('itemCount').innerText = filteredData.length === galleryData.length
      ? `Total: ${galleryData.length} items`
      : `Filtering: ${filteredData.length} / Total: ${galleryData.length} items`;
    btn.innerText = `Export (${count})`;
    btn.style.display = count > 0 ? 'block' : 'none';
  }

  function monitorSelection() {
    document.querySelectorAll('.select-item').forEach(cb => {
      const link = cb.value;
      const card = cb.closest('.card');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedLinks.add(link);
          card.classList.add('selected-card');
        } else {
          selectedLinks.delete(link);
          card.classList.remove('selected-card');
        }
        updateItemCount();
      });
    });
  }

  document.getElementById('exportBtn').addEventListener('click', () => {
    const linksArray = Array.from(selectedLinks);
    const blob = new Blob([linksArray.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seeds.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('.form-check-input:checked').forEach(cb => cb.checked = false);
    document.getElementById('searchInput').value = '';
    searchTerm = "";
    applyFilters();
  });

  createFilters();
  applyFilters();

  document.getElementById('filterAccordion').addEventListener('change', (e) => {
    if (e.target.classList.contains('form-check-input')) {
      applyFilters();
    }
  });

}
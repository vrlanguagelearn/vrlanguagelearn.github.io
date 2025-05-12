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
    const categories = {
      Actress: new Set(),
      Director: new Set(),
      Maker: new Set(),
      Series: new Set(),
      Label: new Set(),
      Keyword: new Set(),
    };

    galleryData.forEach(item => {
      item.actress.forEach(v => categories.Actress.add(v));
      item.director.forEach(v => categories.Director.add(v));
      item.maker.forEach(v => categories.Maker.add(v));
      item.series.forEach(v => categories.Series.add(v));
      item.label.forEach(v => categories.Label.add(v));
      item.keyword.forEach(v => categories.Keyword.add(v));
    });

    Object.keys(categories).forEach(group => {
      const container = document.getElementById(`filter${group}Body`);
      container.innerHTML = [...categories[group]].sort().map(v => {
        const safe = v.replace(/\W/g, '');
        return `<div class="form-check">
          <input class="form-check-input" type="checkbox" value="${v}" data-group="${group.toLowerCase()}" id="chk-${group}-${safe}">
          <label class="form-check-label" for="chk-${group}-${safe}">${v}</label>
        </div>`;
      }).join('');
    });

    // Add size filter inputs
    const sizeInputs = `
      <div class="mt-3">
        <label class="form-label">Size Filter (GB)</label>
        <input type="number" class="form-control form-control-sm mb-2" id="minSizeInput" placeholder="Min size">
        <input type="number" class="form-control form-control-sm" id="maxSizeInput" placeholder="Max size">
      </div>
    `;
    document.querySelector(".sidebar").insertAdjacentHTML("beforeend", sizeInputs);

    // ✅ Bind input events for size filters
    setTimeout(() => {
      document.getElementById('minSizeInput').addEventListener('input', applyFilters);
      document.getElementById('maxSizeInput').addEventListener('input', applyFilters);
    }, 100);
  }

  function parseSizeGB(sizeStr) {
    try {
      return parseFloat(sizeStr.replace(/[^\d.]/g, ''));
    } catch {
      return 0;
    }
  }

  function applyFilters() {
    const checked = Array.from(document.querySelectorAll('.form-check-input:checked'));
    const active = { actress: [], director: [], maker: [], series: [], label: [], keyword: [] };

    checked.forEach(cb => {
      if (cb.dataset.group) {
        active[cb.dataset.group].push(cb.value);
      }
    });

    const minSize = parseFloat(document.getElementById('minSizeInput')?.value);
    const maxSize = parseFloat(document.getElementById('maxSizeInput')?.value);

    filteredData = galleryData.filter(item => {
      const match = Object.keys(active).every(group =>
        active[group].length === 0 || active[group].some(v => item[group]?.includes(v))
      );

      const matchSearch = !searchTerm ||
        item.title.toLowerCase().includes(searchTerm) ||
        (item.actress && item.actress.some(a => a.toLowerCase().includes(searchTerm)));

      const sizeGB = parseSizeGB(item.size);
      const matchMin = isNaN(minSize) || sizeGB >= minSize;
      const matchMax = isNaN(maxSize) || sizeGB <= maxSize;

      return match && matchSearch && matchMin && matchMax;
    });

    renderGalleryPage(1);
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const container = document.getElementById('paginationControls');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const pages = [];
    const makeBtn = (p, active) => `<button class="btn btn-${active ? 'primary' : 'outline-primary'} btn-sm mx-1" onclick="goToPage(${p})">${p}</button>`;

    if (currentPage > 1) {
      pages.push(`<button class="btn btn-outline-primary btn-sm me-2" onclick="goToPage(${currentPage - 1})">&laquo;</button>`);
    }

    if (totalPages <= 12) {
      for (let i = 1; i <= totalPages; i++) pages.push(makeBtn(i, i === currentPage));
    } else {
      pages.push(makeBtn(1, 1 === currentPage));
      if (currentPage > 6) pages.push('<span class="px-2">...</span>');
      for (let i = Math.max(2, currentPage - 4); i <= Math.min(totalPages - 1, currentPage + 4); i++) {
        pages.push(makeBtn(i, i === currentPage));
      }
      if (currentPage < totalPages - 5) pages.push('<span class="px-2">...</span>');
      pages.push(makeBtn(totalPages, totalPages === currentPage));
    }

    if (currentPage < totalPages) {
      pages.push(`<button class="btn btn-outline-primary btn-sm ms-2" onclick="goToPage(${currentPage + 1})">&raquo;</button>`);
    }

    container.innerHTML = pages.join('');
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

  document.getElementById('filterAccordion').addEventListener('change', (e) => {
    if (e.target.classList.contains('form-check-input')) applyFilters();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  });

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
    document.getElementById('minSizeInput').value = '';
    document.getElementById('maxSizeInput').value = '';
    searchTerm = "";
    applyFilters();
  });

  createFilters();
  applyFilters();
}
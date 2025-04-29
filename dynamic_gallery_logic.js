document.addEventListener('DOMContentLoaded', () => {
  if (typeof galleryData !== 'undefined') {
    initGallery();
  }
});

function initGallery() {
  const itemsPerPage = 45;
  let currentPage = 1;
  let filteredData = [...galleryData];
  let searchTerm = "";
  let selectedLinks = new Set();

  function createFilters() {
    const studios = new Set();
    const pornstars = new Set();
    const tags = new Set();
    galleryData.forEach(item => {
      studios.add(item.studio);
      item.pornstar.forEach(p => pornstars.add(p));
      item.tag.forEach(t => tags.add(t));
    });

    const createCheckbox = (value, group) => {
      return `<div class='form-check'>
        <input class='form-check-input' type='checkbox' value='${value}' data-group='${group}'> ${value}
      </div>`;
    };

    document.getElementById('filterStudioBody').innerHTML += [...studios].sort().map(v => createCheckbox(v, "studio")).join("");
    document.getElementById('filterPornstarBody').innerHTML += [...pornstars].sort().map(v => createCheckbox(v, "pornstar")).join("");
    document.getElementById('filterTagBody').innerHTML += [...tags].sort().map(v => createCheckbox(v, "tag")).join("");

    // Add size filters manually
    const sizeRanges = [
      { label: '~ 5 GB', min: 0, max: 5 },
      { label: '5 ~ 10 GB', min: 5, max: 10 },
      { label: '10 ~ 15 GB', min: 10, max: 15 },
      { label: '15 ~ 20 GB', min: 15, max: 20 },
      { label: '20 ~ GB', min: 20, max: Infinity }
    ];

    sizeRanges.forEach(range => {
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input class="form-check-input" type="checkbox" data-group="size" data-min="${range.min}" data-max="${range.max}">
        ${range.label}
      `;
      document.getElementById('filterSizeBody').appendChild(div);
    });
  }

  function applyFilters() {
    const checked = Array.from(document.querySelectorAll('.form-check-input:checked'));
    const active = { studio: [], pornstar: [], tag: [], size: [] };

    checked.forEach(cb => {
      if (cb.dataset.group === "size") {
        active.size.push({ min: parseFloat(cb.dataset.min), max: parseFloat(cb.dataset.max) });
      } else if (cb.dataset.group) {
        active[cb.dataset.group].push(cb.value);
      }
    });

    filteredData = galleryData.filter(item => {
      const matchStudio = !active.studio.length || active.studio.includes(item.studio);
      const matchPornstar = !active.pornstar.length || active.pornstar.some(p => item.pornstar.includes(p));
      const matchTag = !active.tag.length || active.tag.some(t => item.tag.includes(t));
      const sizeGB = parseFloat(item.size);
      const matchSize = !active.size.length || active.size.some(r => sizeGB >= r.min && sizeGB < r.max);
      const matchSearch = !searchTerm || (
        item.title.toLowerCase().includes(searchTerm) ||
        item.pornstar.some(p => p.toLowerCase().includes(searchTerm)) ||
        item.tag.some(t => t.toLowerCase().includes(searchTerm))
      );

      return matchStudio && matchPornstar && matchTag && matchSize && matchSearch;
    });

    renderGalleryPage(1);
  }


  function renderGalleryPage(page) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'block';

    setTimeout(() => {
      currentPage = page;
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const grid = document.getElementById('galleryGrid');

      grid.innerHTML = filteredData.slice(start, end).map((item, index) => `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <img src="${item.img_url}" class="card-img-top" alt="${item.title}">
            <div class="card-body d-flex flex-column">
              <div class="form-check">
                <input class="form-check-input select-item" type="checkbox" value="${item.magnet_link}" id="select-${index}">
                <label class="form-check-label" for="select-${index}">${item.title}</label>
              </div>
              <small class="text-muted">${item.date} &nbsp;|&nbsp; Size: ${item.size}</small>
              <p><strong>Pornstar:</strong> ${item.pornstar.slice(0,3).join(', ')}${item.pornstar.length>3 ? " ..." : ""}</p>
              <button class="btn btn-outline-primary btn-sm mt-auto" onclick="navigator.clipboard.writeText('${item.magnet_link}').then(() => alert('Magnet link copied!'))">Copy Magnet Link</button>
            </div>
          </div>
        </div>
      `).join('');

      updateItemCount();
      renderPagination();
      monitorSelection();

      overlay.style.display = 'none';

      // ✅ Scroll the correct main content div, not window
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }, 500);
  }



  function renderPagination() {
    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    const pagination = document.getElementById('paginationControls');
    pagination.innerHTML = "";

    if (pageCount <= 1) return;

    const pages = [];
    pages.push(1);
    for (let i = currentPage - 5; i <= currentPage + 5; i++) {
      if (i > 1 && i < pageCount) pages.push(i);
    }
    if (!pages.includes(pageCount)) pages.push(pageCount);

    let last = 0;
    pages.sort((a,b) => a-b).forEach(p => {
      if (p - last > 1) pagination.innerHTML += `<span class="px-2">...</span>`;
      pagination.innerHTML += `<button class="btn btn-sm ${p===currentPage ? 'btn-primary' : 'btn-outline-primary'} mx-1" onclick="renderGalleryPage(${p})">${p}</button>`;
      last = p;
    });
  }

  function updateItemCount() {
    const itemCount = document.getElementById('itemCount');
    if (filteredData.length === galleryData.length && !searchTerm) {
      itemCount.innerText = `Total: ${galleryData.length} items`;
    } else {
      itemCount.innerText = `Filtering: ${filteredData.length} items / Total: ${galleryData.length} items`;
    }
    const count = selectedLinks.size;
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.innerText = `Export Magnet Link (${count})`;
    exportBtn.style.display = count > 0 ? 'block' : 'none';
  }

  function monitorSelection() {
    document.querySelectorAll('.select-item').forEach(cb => {
      const link = cb.value;
      const card = cb.closest('.card');
      if (selectedLinks.has(link)) {
        cb.checked = true;
        card.classList.add('selected-card');
      }
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
    a.download = 'magnet_links.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('.form-check-input:checked').forEach(cb => cb.checked = false);
    document.getElementById('searchInput').value = '';
    searchTerm = "";
    applyFilters();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  createFilters();
  renderGalleryPage(1);
  document.querySelectorAll('.form-check-input').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });

  window.renderGalleryPage = renderGalleryPage;
}

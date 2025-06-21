import dayjs from './dayjs-init';
import Chart from 'chart.js/auto';
import 'jquery-ui/ui/widgets/datepicker';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

// Constants
const inventoryData = [
  ['Selfish and Self-Seeking', 'Interest in Others'],
  ['Dishonest', 'Honest'],
  ['Frightened', 'Courage'],
  ['Inconsiderate', 'Considerate'],
  ['Prideful', "humility-Seek God's Will"],
  ['Greedy', 'Giving and Sharing'],
  ['Lustful', 'Doing for Others'],
  ['Anger', 'Calm'],
  ['Envy', 'Grateful'],
  ['Sloth', 'Take Action'],
  ['Gluttony', 'Moderation'],
  ['Impatient', 'Patience'],
  ['Intolerant', 'Tolerance'],
  ['Resentment', 'Forgiveness'],
  ['Hate', 'Love & Concern for Others'],
  ['Harmful Acts', 'Good Deeds'],
  ['Self-Pity', 'Self-Forgiveness'],
  ['Self-Justification', "Humility-Seek Good's Will"],
  ['Self-Importance', 'Modesty'],
  ['Self-Condemnation', 'Self-Forgiveness'],
  ['Suspicion', 'Trust'],
  ['Doubt', 'Faith'],
  ['HOW DO YOU FEEL?', 'HOW YOU FEEL?'],
  ['Restless, Irritable, Guilt, Shame, Discontent', 'Peaceful, Serene, Loving, Content'],
];

// State
let currentDate = dayjs().format('YYYY-MM-DD');
// Get timezone from browser's Intl API first, then fallback to Day.js guess
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const userTimezone = browserTimezone || dayjs.tz.guess();

// Chart Configuration
const chartConfig = {
  type: 'pie',
  options: {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    cutout: '0%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        enabled: true,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  },
};

// Initialize Charts
const dailyChart = new Chart(document.getElementById('daily-chart'), {
  ...chartConfig,
  data: {
    labels: ['Self-Will', "God's Will"],
    datasets: [
      {
        data: [0, 1],
        backgroundColor: ['#ffe69c', '#a3cfbb'],
        borderWidth: 1,
        borderColor: '#000',
        hoverOffset: 0,
      },
    ],
  },
});

const averageChart = new Chart(document.getElementById('average-chart'), {
  ...chartConfig,
  data: {
    labels: ['Avg Self-Will', "Avg God's Will"],
    datasets: [
      {
        data: [0, 1],
        backgroundColor: ['#ffe69c', '#a3cfbb'],
        borderWidth: 1,
        borderColor: '#000',
        hoverOffset: 0,
      },
    ],
  },
});

// Helper Functions
function formatDateForDisplay(date) {
  return dayjs.tz(date, userTimezone).format('MMMM D, YYYY');
}

function getTodayInUserTimezone() {
  return dayjs().tz(userTimezone).format('YYYY-MM-DD');
}

function isDateInPast(date) {
  return (
    dayjs.tz(date, userTimezone).isBefore(dayjs().tz(userTimezone), 'day') ||
    dayjs.tz(date, userTimezone).isSame(dayjs().tz(userTimezone), 'day')
  );
}

// Core Functions
function setDate(date) {
  currentDate = date;
  $('#date-display').val(formatDateForDisplay(currentDate));
  $('#timezone-display').text(`Timezone: ${userTimezone}`);
  loadTable();
  loadFromLocalStorage();
  updateCharts();
}

function adjustDate(offset) {
  const newDate = dayjs.tz(currentDate, userTimezone).add(offset, 'day').format('YYYY-MM-DD');
  if (isDateInPast(newDate)) {
    setDate(newDate);
  }
}

function getCurrentSelections() {
  const selections = [];
  $('#inventory-table tr').each(function () {
    const index = $(this).data('index');
    if (index === undefined) return;
    if ($(this).find('.left').hasClass('selected-left')) {
      selections.push(0);
    } else if ($(this).find('.right').hasClass('selected-right')) {
      selections.push(1);
    } else {
      selections.push(null);
    }
  });
  return selections;
}

function loadTable() {
  const $tbody = $('#inventory-table');
  $tbody.empty();

  // Add header row
  $tbody.append(`
    <tr class="alert-primary">
      <th>PERSONALITY CHARACTERISTICS OF SELF-WILL</th>
      <th class="alert-primary fw-bold">OR</th>
      <th>PERSONALITY CHARACTERISTICS OF GOD'S WILL</th>
    </tr>
  `);

  // Add data rows
  inventoryData.forEach((pair, index) => {
    if (pair[0] === 'HOW DO YOU FEEL?') {
      $tbody.append(
        `<tr class="alert-primary fw-bold" data-index="${index}"><td>${pair[0]}</td><td class="alert-primary fw-bold"></td><td>${pair[1]}</td></tr>`
      );
      return;
    }
    const row = $(`
      <tr data-index="${index}">
        <td class="clickable left">${pair[0]}</td>
        <td class="alert-primary fw-bold">OR</td>
        <td class="clickable right">${pair[1]}</td>
      </tr>
    `);
    $tbody.append(row);
  });
  updateRemainingFields();
}

function updateRemainingFields() {
  const selections = getCurrentSelections();
  const totalFields = inventoryData.length - 1;
  const filledFields = selections.filter((v) => v !== null).length;
  const remainingFields = totalFields - filledFields;

  const alertHtml =
    remainingFields === 0
      ? `<div class="alert text-center mb-3" role="alert" style="background-color: #a3cfbb; border-color: #a3cfbb; color: #000;">Daily inventory is complete for ${currentDate}</div>`
      : `<div class="alert alert-info text-center mb-3" role="alert">Answers Remaining: <span id="fields-left">${remainingFields}</span></div>`;

  $('#remaining-fields, #remaining-fields-bottom').html(alertHtml);
}

function updateCharts() {
  const selections = getCurrentSelections();
  const leftCount = selections.filter((v) => v === 0).length;
  const rightCount = selections.filter((v) => v === 1).length;

  dailyChart.data.datasets[0].data = [leftCount, rightCount];
  dailyChart.update();

  const allData = JSON.parse(localStorage.getItem('dailyInventory') || '[]');
  let totalLeft = 0,
    totalRight = 0,
    totalDays = 0;
  allData.forEach((obj) => {
    const key = Object.keys(obj)[0];
    const arr = obj[key];
    totalLeft += arr.filter((v) => v === 0).length;
    totalRight += arr.filter((v) => v === 1).length;
    totalDays++;
  });
  averageChart.data.datasets[0].data = [
    totalDays ? totalLeft / totalDays : 0,
    totalDays ? totalRight / totalDays : 0,
  ];
  averageChart.update();
}

// Local Storage Functions
function saveToLocalStorage() {
  const allData = JSON.parse(localStorage.getItem('dailyInventory') || '[]');
  const currentData = getCurrentSelections();
  const updated = allData.filter((obj) => !obj[currentDate]);
  updated.push({ [currentDate]: currentData });
  localStorage.setItem('dailyInventory', JSON.stringify(updated));
  updateExportButton();
}

function loadFromLocalStorage() {
  const allData = JSON.parse(localStorage.getItem('dailyInventory') || '[]');
  const entry = allData.find((obj) => obj[currentDate]);
  if (entry) {
    const data = entry[currentDate];
    $('#inventory-table tr').each(function () {
      const index = $(this).data('index');
      if (index === undefined) return;
      const value = data[index];
      if (value === 0) {
        $(this).find('.left').addClass('selected-left');
        $(this).find('.right').removeClass('selected-right');
      } else if (value === 1) {
        $(this).find('.right').addClass('selected-right');
        $(this).find('.left').removeClass('selected-left');
      }
    });
    updateRemainingFields();
  }
}

function updateExportButton() {
  const data = localStorage.getItem('dailyInventory');
  const hasData = data && JSON.parse(data).length > 0;
  $('#export-btn').prop('disabled', !hasData);
}

// Modal Functions
function showModal(modalId) {
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();
}

function hideModal(modalId) {
  const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
  if (modal) modal.hide();
}

// Event Handlers
$(document).ready(function () {
  // Initialize datepicker
  $('#date-display')
    .datepicker({
      dateFormat: 'MM d, yy',
      maxDate: 0, // Prevents selecting future dates
      onSelect: function (dateText) {
        const selectedDate = dayjs(dateText, 'MMM D, YYYY').format('YYYY-MM-DD');
        setDate(selectedDate);
      },
      beforeShow: function (input, inst) {
        // Ensure the datepicker appears above other elements
        inst.dpDiv.css({
          zIndex: 9999,
        });
      },
      showButtonPanel: true,
      currentText: 'Today',
      showOtherMonths: true,
      selectOtherMonths: true,
      onClose: function (dateText, inst) {
        // If no date was selected, revert to the current date
        if (!dateText) {
          $(this).datepicker('setDate', currentDate);
        }
      },
    })
    .datepicker('setDate', currentDate);

  // Handle Today button click separately
  $(document).on('click', '.ui-datepicker-current', function (e) {
    e.preventDefault();
    setDate(getTodayInUserTimezone());
    // Don't close the datepicker
    return false;
  });

  // Navigation buttons
  $('#prev-date').on('click', () => adjustDate(-1));
  $('#next-date').on('click', () => adjustDate(1));

  // Table cell clicks
  $(document).on('click', '.clickable.left', function () {
    $(this).addClass('selected-left').siblings('.right').removeClass('selected-right');
    saveToLocalStorage();
    updateCharts();
    updateRemainingFields();
  });

  $(document).on('click', '.clickable.right', function () {
    $(this).addClass('selected-right').siblings('.left').removeClass('selected-left');
    saveToLocalStorage();
    updateCharts();
    updateRemainingFields();
  });

  // Export/Import
  $('#export-btn').on('click', () => {
    const data = localStorage.getItem('dailyInventory');
    if (!data || JSON.parse(data).length === 0) return;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-inventory-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  $('#import-file').on('change', function () {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          localStorage.setItem('dailyInventory', JSON.stringify(data));
          alert('Data imported successfully!');
          setDate(currentDate);
        } else {
          throw new Error('Invalid format');
        }
      } catch {
        alert('Invalid file.');
      }
    };
    reader.readAsText(file);
  });

  // Settings functionality
  $('#settings-btn').on('click', () => showModal('settings-modal'));
  $('#settings-reset-btn').on('click', () => {
    hideModal('settings-modal');
    showModal('reset-modal');
  });

  // Charts functionality
  $('#charts-btn').on('click', () => showModal('charts-modal'));

  // Reset confirmation
  $('#confirm-reset').on('click', function () {
    localStorage.clear();
    setDate(getTodayInUserTimezone());
    hideModal('reset-modal');
  });

  // Initialize
  currentDate = getTodayInUserTimezone();
  setDate(currentDate);
  updateExportButton();

  // Modal close buttons
  document.querySelectorAll('.modal .btn-close').forEach((button) => {
    button.addEventListener('click', function () {
      const modal = bootstrap.Modal.getInstance(this.closest('.modal'));
      if (modal) modal.hide();
    });
  });
});

// Prevent zoom but allow scrolling, excluding canvas elements
function shouldPreventZoom(e) {
  return e.target.tagName.toLowerCase() !== 'canvas' && e.scale !== 1;
}

['gesturestart', 'gesturechange', 'gestureend', 'touchmove'].forEach((event) => {
  document.addEventListener(
    event,
    (e) => {
      if (shouldPreventZoom(e)) e.preventDefault();
    },
    { passive: false }
  );
});

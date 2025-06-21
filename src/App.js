import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileExport,
  faChartPie,
  faCog,
  faMobileAlt,
  faTrashAlt,
  faInfoCircle,
  faShare,
  faEllipsisV,
  faBell,
  faBellSlash,
} from '@fortawesome/free-solid-svg-icons';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/datepicker';
import 'jquery-ui/dist/themes/base/jquery-ui.css';

// Import custom styles
import './assets/css/styles.css';

// Import notification service
import NotificationService from './assets/js/notificationService';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Constants
const inventoryData = [
  ['Selfish and Self-Seeking', 'Interest in Others'],
  ['Dishonest', 'Honest'],
  ['Frightened', 'Courage'],
  ['Inconsiderate', 'Considerate'],
  ['Prideful', 'humility-Seek God&apos;s Will'],
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
  ['Self-Justification', 'Humility-Seek God&apos;s Will'],
  ['Self-Importance', 'Modesty'],
  ['Self-Condemnation', 'Self-Forgiveness'],
  ['Suspicion', 'Trust'],
  ['Doubt', 'Faith'],
  ['HOW DO YOU FEEL?', 'HOW YOU FEEL?'],
  ['Restless, Irritable, Guilt, Shame, Discontent', 'Peaceful, Serene, Loving, Content'],
];

// Chart Configuration
const chartConfig = {
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

function App() {
  // Get timezone from browser's Intl API first, then fallback to Day.js guess
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userTimezone = browserTimezone || dayjs.tz.guess();
  const dateInputRef = useRef(null);

  // State
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selections, setSelections] = useState(Array(inventoryData.length).fill(null));
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [allData, setAllData] = useState([]);

  // Notification state
  const [notificationService] = useState(() => new NotificationService());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState({ hour: 9, minute: 0 });
  const [showFirstTimeNotificationModal, setShowFirstTimeNotificationModal] = useState(false);

  // Close all modals
  const closeAllModals = () => {
    setShowChartsModal(false);
    setShowSettingsModal(false);
    setShowInstallModal(false);
    setShowResetModal(false);
    setShowFirstTimeNotificationModal(false);
  };

  // Handle escape key and outside clicks
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeAllModals();
      }
    };

    const handleOutsideClick = (event) => {
      if (event.target.classList.contains('modal')) {
        closeAllModals();
      }
    };

    // Add event listeners if any modal is open
    if (
      showChartsModal ||
      showSettingsModal ||
      showInstallModal ||
      showResetModal ||
      showFirstTimeNotificationModal
    ) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleOutsideClick);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [
    showChartsModal,
    showSettingsModal,
    showInstallModal,
    showResetModal,
    showFirstTimeNotificationModal,
  ]);

  // Inject git commit hash
  useEffect(() => {
    const gitCommitElement = document.getElementById('git-commit-hash');
    if (gitCommitElement && process.env.GIT_COMMIT_HASH) {
      gitCommitElement.textContent = process.env.GIT_COMMIT_HASH;
    }
  }, []);

  // Initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      const initialized = await notificationService.init();
      if (initialized) {
        setNotificationsEnabled(notificationService.isEnabled());

        // Load saved notification time
        const savedTime = notificationService.getNotificationTime();
        if (savedTime) {
          setNotificationTime(savedTime);
        }
      }
    };

    initNotifications();
  }, [notificationService]);

  // Check if this is the user's first time and show notification prompt
  useEffect(() => {
    const hasSeenNotificationPrompt = localStorage.getItem('hasSeenNotificationPrompt');

    if (!hasSeenNotificationPrompt && notificationService.isSupported) {
      // Wait a moment for the app to load, then show the prompt
      const timer = setTimeout(() => {
        setShowFirstTimeNotificationModal(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [notificationService.isSupported]);

  const isDateInPast = React.useCallback(
    (date) => {
      return (
        dayjs.tz(date, userTimezone).isBefore(dayjs().tz(userTimezone), 'day') ||
        dayjs.tz(date, userTimezone).isSame(dayjs().tz(userTimezone), 'day')
      );
    },
    [userTimezone]
  );

  // Initialize jQuery UI Datepicker
  useEffect(() => {
    const inputEl = dateInputRef.current;

    if (inputEl) {
      $(inputEl).datepicker({
        dateFormat: 'MM dd, yy',
        maxDate: 0,
        showButtonPanel: true,
        onSelect: function (dateText, inst) {
          const selectedDate = dayjs(dateText, 'MM DD, YYYY').format('YYYY-MM-DD');
          if (isDateInPast(selectedDate)) {
            setCurrentDate(selectedDate);
          }
        },
        beforeShow: function (input, inst) {
          // Position the datepicker properly
          setTimeout(function () {
            const inputOffset = $(input).offset();
            const inputWidth = $(input).outerWidth();
            const calendarWidth = 300; // Width of the calendar
            const leftPosition = inputOffset.left + inputWidth / 2 - calendarWidth / 2;

            inst.dpDiv.css({
              top: inputOffset.top + $(input).outerHeight(),
              left: leftPosition,
            });
          }, 0);
        },
      });

      // Use mutation observer to detect Today button clicks
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'childList') {
            const todayButton = document.querySelector('.ui-datepicker-current');
            if (todayButton && !todayButton.dataset.listenerAdded) {
              todayButton.dataset.listenerAdded = 'true';
              todayButton.addEventListener('click', function () {
                setTimeout(() => {
                  const today = dayjs().format('YYYY-MM-DD');
                  setCurrentDate(today);
                }, 50);
              });
            }
          }
        });
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Store observer for cleanup
      window.datepickerObserver = observer;
    }

    // Cleanup
    return () => {
      if (inputEl) {
        $(inputEl).datepicker('destroy');
      }
      // Cleanup observer
      if (window.datepickerObserver) {
        window.datepickerObserver.disconnect();
        delete window.datepickerObserver;
      }
    };
  }, [isDateInPast]);

  // Helper Functions
  const formatDateForDisplay = (date) => {
    return dayjs.tz(date, userTimezone).format('MMMM D, YYYY');
  };

  // Load data from localStorage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyInventory') || '[]');
    setAllData(savedData);

    // Load selections for current date
    const entry = savedData.find((obj) => obj[currentDate]);
    if (entry) {
      setSelections(entry[currentDate]);
    } else {
      setSelections(Array(inventoryData.length).fill(null));
    }
  }, [currentDate]);

  const loadFromLocalStorage = (date, data) => {
    const entry = data.find((obj) => obj[date]);
    if (entry) {
      setSelections(entry[date]);
    } else {
      setSelections(Array(inventoryData.length).fill(null));
    }
  };

  // Date navigation
  const adjustDate = (offset) => {
    const newDate = dayjs.tz(currentDate, userTimezone).add(offset, 'day').format('YYYY-MM-DD');
    if (isDateInPast(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Handle selection
  const handleSelection = (index, value) => {
    if (inventoryData[index][0] === 'HOW DO YOU FEEL?') return; // Skip header row

    const newSelections = [...selections];
    newSelections[index] = value;
    setSelections(newSelections);

    // Save immediately with the new selections
    const updated = allData.filter((obj) => !obj[currentDate]);
    const newData = [...updated, { [currentDate]: newSelections }];
    setAllData(newData);
    localStorage.setItem('dailyInventory', JSON.stringify(newData));
  };

  // Calculate remaining fields
  const getRemainingFields = () => {
    const totalFields = inventoryData.length - 1; // Exclude header row
    const filledFields = selections.filter((v) => v !== null).length;
    return totalFields - filledFields;
  };

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-inventory-${dayjs().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setAllData(importedData);
          localStorage.setItem('dailyInventory', JSON.stringify(importedData));
          loadFromLocalStorage(currentDate, importedData);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset all data
  const resetAllData = () => {
    setAllData([]);
    setSelections(Array(inventoryData.length).fill(null));
    localStorage.removeItem('dailyInventory');
    setShowResetModal(false);
    setShowSettingsModal(false);
  };

  // Chart data
  const getChartData = () => {
    const leftCount = selections.filter((v) => v === 0).length;
    const rightCount = selections.filter((v) => v === 1).length;

    return {
      labels: ['Self-Will', 'God&apos;s Will'],
      datasets: [
        {
          data: [leftCount, rightCount],
          backgroundColor: ['#ffe69c', '#a3cfbb'],
          borderWidth: 1,
          borderColor: '#000',
          hoverOffset: 0,
        },
      ],
    };
  };

  const getAverageChartData = () => {
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

    return {
      labels: ['Avg Self-Will', 'Avg God&apos;s Will'],
      datasets: [
        {
          data: [totalDays ? totalLeft / totalDays : 0, totalDays ? totalRight / totalDays : 0],
          backgroundColor: ['#ffe69c', '#a3cfbb'],
          borderWidth: 1,
          borderColor: '#000',
          hoverOffset: 0,
        },
      ],
    };
  };

  // Notification handlers
  const handleEnableNotifications = async () => {
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        await notificationService.scheduleDailyNotification(
          notificationTime.hour,
          notificationTime.minute
        );
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await notificationService.cancelNotifications();
      setNotificationsEnabled(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  const handleUpdateNotificationTime = async (hour, minute) => {
    const newTime = { hour, minute };
    setNotificationTime(newTime);

    if (notificationsEnabled) {
      try {
        await notificationService.scheduleDailyNotification(hour, minute);
      } catch (error) {
        console.error('Error updating notification time:', error);
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.testNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };

  // First-time notification modal handlers
  const handleFirstTimeEnableNotifications = async () => {
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        await notificationService.scheduleDailyNotification(
          notificationTime.hour,
          notificationTime.minute
        );
      }
      // Mark that user has seen the prompt
      localStorage.setItem('hasSeenNotificationPrompt', 'true');
      setShowFirstTimeNotificationModal(false);
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const handleFirstTimeSkipNotifications = () => {
    // Mark that user has seen the prompt
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
    setShowFirstTimeNotificationModal(false);
  };

  const handleFirstTimeUpdateNotificationTime = (hour, minute) => {
    setNotificationTime({ hour, minute });
  };

  const remainingFields = getRemainingFields();
  const hasData = allData.length > 0;

  return (
    <div className="container my-4">
      <h1 className="text-center">Daily Inventory</h1>
      <p className="text-center">
        When we retire at night, we constructively review our day. Were we resentful, selfish,
        dishonest, or afraid?
      </p>

      {/* Date Navigation */}
      <div className="row">
        <div className="col text-center">
          <div className="d-flex align-items-center justify-content-center">
            <button className="btn btn-primary me-2" onClick={() => adjustDate(-1)}>
              &#8592;
            </button>
            <input
              ref={dateInputRef}
              type="text"
              value={formatDateForDisplay(currentDate)}
              readOnly
              className="h3 border-0 bg-transparent text-center mx-2"
              style={{ cursor: 'pointer', minWidth: '200px' }}
            />
            <button className="btn btn-primary ms-2" onClick={() => adjustDate(1)}>
              &#8594;
            </button>
          </div>
          <div className="small text-muted mt-1">Timezone: {userTimezone}</div>
        </div>
      </div>

      {/* Progress Counter */}
      <div className="counter text-center mt-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
        {remainingFields === 0 ? (
          <div
            className="alert text-center mb-3"
            role="alert"
            style={{ backgroundColor: '#a3cfbb', borderColor: '#a3cfbb', color: '#000' }}
          >
            Daily inventory is complete for {currentDate}
          </div>
        ) : (
          <div className="alert alert-info text-center mb-3" role="alert">
            Answers Remaining: {remainingFields}
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ maxWidth: '700px', minWidth: '375px', margin: '0 auto' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead>
                <tr className="table-inventory-header">
                  <th className="table-inventory-header">
                    PERSONALITY CHARACTERISTICS OF SELF-WILL
                  </th>
                  <th className="table-inventory-header fw-bold">OR</th>
                  <th className="table-inventory-header">
                    PERSONALITY CHARACTERISTICS OF GOD&apos;S WILL
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((pair, index) => (
                  <tr key={index} data-index={index}>
                    {pair[0] === 'HOW DO YOU FEEL?' ? (
                      <>
                        <td className="alert-primary fw-bold">{pair[0]}</td>
                        <td className="alert-primary fw-bold"></td>
                        <td className="alert-primary fw-bold">{pair[1]}</td>
                      </>
                    ) : (
                      <>
                        <td
                          className={`clickable ${selections[index] === 0 ? 'selected-left' : ''}`}
                          onClick={() => handleSelection(index, 0)}
                        >
                          {pair[0]}
                        </td>
                        <td className="alert-primary fw-bold">OR</td>
                        <td
                          className={`clickable ${selections[index] === 1 ? 'selected-right' : ''}`}
                          onClick={() => handleSelection(index, 1)}
                        >
                          {pair[1]}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="row mt-4">
        <div className="col text-center">
          <button
            className="btn btn-primary me-2"
            title="View Charts"
            onClick={() => setShowChartsModal(true)}
          >
            <FontAwesomeIcon icon={faChartPie} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)}>
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>

      {/* Install App Button */}
      <div className="row mt-4">
        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-success btn-lg"
            onClick={() => setShowInstallModal(true)}
          >
            <FontAwesomeIcon icon={faMobileAlt} /> Install App
          </button>
        </div>
      </div>

      {/* Charts Modal */}
      {showChartsModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Daily Inventory Charts</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChartsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div className="text-center">
                      <h6 className="mb-3 text-dark">Today&apos;s Daily Totals</h6>
                      <div
                        className="chart-container"
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          height: '300px',
                          margin: '0 auto',
                          position: 'relative',
                        }}
                      >
                        <Pie
                          data={getChartData()}
                          options={{
                            ...chartConfig.options,
                            plugins: {
                              ...chartConfig.options.plugins,
                              legend: {
                                ...chartConfig.options.plugins.legend,
                                position: 'bottom',
                                labels: {
                                  padding: 20,
                                  usePointStyle: true,
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-center">
                      <h6 className="mb-3 text-dark">All Daily Totals (Average)</h6>
                      <div
                        className="chart-container"
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          height: '300px',
                          margin: '0 auto',
                          position: 'relative',
                        }}
                      >
                        <Pie
                          data={getAverageChartData()}
                          options={{
                            ...chartConfig.options,
                            plugins: {
                              ...chartConfig.options.plugins,
                              legend: {
                                ...chartConfig.options.plugins.legend,
                                position: 'bottom',
                                labels: {
                                  padding: 20,
                                  usePointStyle: true,
                                  font: {
                                    size: 12,
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowChartsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install PWA Modal */}
      {showInstallModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Install Spiritual Growth Tracker</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInstallModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">Install this app on your device for quick and easy access:</h6>

                <div className="mb-4">
                  <h6>
                    <FontAwesomeIcon icon={faMobileAlt} /> iOS (iPhone/iPad)
                  </h6>
                  <ol>
                    <li>Open this website in Safari</li>
                    <li>
                      Tap the Share button <FontAwesomeIcon icon={faShare} /> at the bottom of the
                      screen
                    </li>
                    <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                    <li>Tap &quot;Add&quot; in the top right corner</li>
                  </ol>
                </div>

                <div className="mb-4">
                  <h6>
                    <FontAwesomeIcon icon={faMobileAlt} /> Android
                  </h6>
                  <ol>
                    <li>Open this website in Chrome</li>
                    <li>
                      Tap the menu button <FontAwesomeIcon icon={faEllipsisV} /> in the top right
                    </li>
                    <li>Tap &quot;Add to Home screen&quot; or &quot;Install app&quot;</li>
                    <li>Follow the prompts to complete installation</li>
                  </ol>
                </div>

                <div className="mb-4">
                  <h6>
                    <FontAwesomeIcon icon={faMobileAlt} /> Windows
                  </h6>
                  <ol>
                    <li>Open this website in Microsoft Edge</li>
                    <li>
                      Click the menu button <FontAwesomeIcon icon={faEllipsisV} /> in the top right
                    </li>
                    <li>Click &quot;Apps&quot; and then &quot;Install this site as an app&quot;</li>
                    <li>Click &quot;Install&quot; in the prompt that appears</li>
                  </ol>
                </div>

                <div className="alert alert-info">
                  <FontAwesomeIcon icon={faInfoCircle} /> Once installed, you can access the app
                  directly from your home screen or app drawer, just like a native app!
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInstallModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Settings</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSettingsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-grid gap-3">
                  {/* Notification Settings */}
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <FontAwesomeIcon
                          icon={notificationsEnabled ? faBell : faBellSlash}
                          className="me-2"
                        />
                        Daily Reminders
                      </h6>
                    </div>
                    <div className="card-body">
                      {!notificationsEnabled ? (
                        <div className="text-center">
                          <p className="text-muted mb-3">
                            Get daily reminders to complete your inventory
                          </p>
                          <button className="btn btn-primary" onClick={handleEnableNotifications}>
                            <FontAwesomeIcon icon={faBell} className="me-2" />
                            Enable Notifications
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3">
                            <label className="form-label">Reminder Time:</label>
                            <div className="row">
                              <div className="col-6">
                                <select
                                  className="form-select"
                                  value={notificationTime.hour}
                                  onChange={(e) =>
                                    handleUpdateNotificationTime(
                                      parseInt(e.target.value),
                                      notificationTime.minute
                                    )
                                  }
                                >
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i}>
                                      {i === 0 ? '12' : i > 12 ? i - 12 : i} {i >= 12 ? 'PM' : 'AM'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-6">
                                <select
                                  className="form-select"
                                  value={notificationTime.minute}
                                  onChange={(e) =>
                                    handleUpdateNotificationTime(
                                      notificationTime.hour,
                                      parseInt(e.target.value)
                                    )
                                  }
                                >
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <option key={i} value={i}>
                                      {i.toString().padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={handleTestNotification}
                            >
                              Test Notification
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={handleDisableNotifications}
                            >
                              <FontAwesomeIcon icon={faBellSlash} className="me-2" />
                              Disable
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Data Management</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-primary"
                          title="Export Data"
                          onClick={exportData}
                          disabled={!hasData}
                        >
                          <FontAwesomeIcon icon={faFileExport} className="me-2" />
                          Export Data
                        </button>
                        <input
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          onChange={importData}
                          id="import-input"
                        />
                        <button
                          className="btn btn-primary"
                          title="Import Data"
                          onClick={() => document.getElementById('import-input').click()}
                        >
                          <FontAwesomeIcon
                            icon={faFileExport}
                            style={{ transform: 'rotate(180deg)' }}
                            className="me-2"
                          />
                          Import Data
                        </button>
                        <button className="btn btn-danger" onClick={() => setShowResetModal(true)}>
                          <FontAwesomeIcon icon={faTrashAlt} className="me-2" />
                          Reset All Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Reset</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to reset all your data? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={resetAllData}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First-Time Notification Modal */}
      {showFirstTimeNotificationModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FontAwesomeIcon icon={faBell} className="me-2" />
                  Stay on Track with Daily Reminders
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleFirstTimeSkipNotifications}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <h6>
                    Would you like to receive daily reminders to complete your spiritual inventory?
                  </h6>
                  <p className="text-muted">
                    This helps maintain consistency in your spiritual growth journey. You can always
                    change this later in settings.
                  </p>
                </div>

                <div className="card">
                  <div className="card-body">
                    <label className="form-label fw-bold">Set your preferred reminder time:</label>
                    <div className="row">
                      <div className="col-6">
                        <select
                          className="form-select"
                          value={notificationTime.hour}
                          onChange={(e) =>
                            handleFirstTimeUpdateNotificationTime(
                              parseInt(e.target.value),
                              notificationTime.minute
                            )
                          }
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '12' : i > 12 ? i - 12 : i} {i >= 12 ? 'PM' : 'AM'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6">
                        <select
                          className="form-select"
                          value={notificationTime.minute}
                          onChange={(e) =>
                            handleFirstTimeUpdateNotificationTime(
                              notificationTime.hour,
                              parseInt(e.target.value)
                            )
                          }
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <small className="text-muted">
                      You&apos;ll receive a daily reminder at{' '}
                      {notificationTime.hour === 0
                        ? '12'
                        : notificationTime.hour > 12
                          ? notificationTime.hour - 12
                          : notificationTime.hour}
                      :{notificationTime.minute.toString().padStart(2, '0')}{' '}
                      {notificationTime.hour >= 12 ? 'PM' : 'AM'}
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleFirstTimeSkipNotifications}
                >
                  Maybe Later
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFirstTimeEnableNotifications}
                >
                  <FontAwesomeIcon icon={faBell} className="me-2" />
                  Enable Daily Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

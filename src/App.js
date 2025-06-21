import React, { useState, useEffect } from 'react';
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
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Constants
const inventoryData = [
  ["Selfish and Self-Seeking", "Interest in Others"],
  ["Dishonest", "Honest"],
  ["Frightened", "Courage"],
  ["Inconsiderate", "Considerate"],
  ["Prideful", "humility-Seek God's Will"],
  ["Greedy", "Giving and Sharing"],
  ["Lustful", "Doing for Others"],
  ["Anger", "Calm"],
  ["Envy", "Grateful"],
  ["Sloth", "Take Action"],
  ["Gluttony", "Moderation"],
  ["Impatient", "Patience"],
  ["Intolerant", "Tolerance"],
  ["Resentment", "Forgiveness"],
  ["Hate", "Love & Concern for Others"],
  ["Harmful Acts", "Good Deeds"],
  ["Self-Pity", "Self-Forgiveness"],
  ["Self-Justification", "Humility-Seek Good's Will"],
  ["Self-Importance", "Modesty"],
  ["Self-Condemnation", "Self-Forgiveness"],
  ["Suspicion", "Trust"],
  ["Doubt", "Faith"],
  ["HOW DO YOU FEEL?", "HOW YOU FEEL?"],
  ["Restless, Irritable, Guilt, Shame, Discontent", "Peaceful, Serene, Loving, Content"]
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
        position: 'bottom'
      },
      tooltip: {
        enabled: true
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  }
};

function App() {
  // Get timezone from browser's Intl API first, then fallback to Day.js guess
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userTimezone = browserTimezone || dayjs.tz.guess();

  // State
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selections, setSelections] = useState(Array(inventoryData.length).fill(null));
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [allData, setAllData] = useState([]);

  // Helper Functions
  const formatDateForDisplay = (date) => {
    return dayjs.tz(date, userTimezone).format('MMMM D, YYYY');
  };

  const getTodayInUserTimezone = () => {
    return dayjs().tz(userTimezone).format('YYYY-MM-DD');
  };

  const isDateInPast = (date) => {
    return dayjs.tz(date, userTimezone).isBefore(dayjs().tz(userTimezone), 'day') || 
           dayjs.tz(date, userTimezone).isSame(dayjs().tz(userTimezone), 'day');
  };

  // Load data from localStorage
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('dailyInventory') || '[]');
    setAllData(savedData);
    loadFromLocalStorage(currentDate, savedData);
  }, [currentDate]);

  const loadFromLocalStorage = (date, data = allData) => {
    const entry = data.find(obj => obj[date]);
    if (entry) {
      setSelections(entry[date]);
    } else {
      setSelections(Array(inventoryData.length).fill(null));
    }
  };

  // Save to localStorage
  const saveToLocalStorage = () => {
    const currentData = selections;
    const updated = allData.filter(obj => !obj[currentDate]);
    const newData = [...updated, { [currentDate]: currentData }];
    setAllData(newData);
    localStorage.setItem('dailyInventory', JSON.stringify(newData));
  };

  // Date navigation
  const adjustDate = (offset) => {
    const newDate = dayjs.tz(currentDate, userTimezone)
        .add(offset, 'day')
        .format('YYYY-MM-DD');
    if (isDateInPast(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Handle selection
  const handleSelection = (index, value) => {
    if (inventoryData[index][0] === "HOW DO YOU FEEL?") return; // Skip header row
    
    const newSelections = [...selections];
    newSelections[index] = value;
    setSelections(newSelections);
    
    // Auto-save after a short delay
    setTimeout(() => {
      saveToLocalStorage();
    }, 100);
  };

  // Calculate remaining fields
  const getRemainingFields = () => {
    const totalFields = inventoryData.length - 1; // Exclude header row
    const filledFields = selections.filter(v => v !== null).length;
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
    const leftCount = selections.filter(v => v === 0).length;
    const rightCount = selections.filter(v => v === 1).length;

    return {
      labels: ['Self-Will', 'God\'s Will'],
      datasets: [{ 
        data: [leftCount, rightCount], 
        backgroundColor: ['#ffe69c', '#a3cfbb'],
        borderWidth: 1,
        borderColor: '#000',
        hoverOffset: 0
      }]
    };
  };

  const getAverageChartData = () => {
    let totalLeft = 0, totalRight = 0, totalDays = 0;
    allData.forEach(obj => {
      const key = Object.keys(obj)[0];
      const arr = obj[key];
      totalLeft += arr.filter(v => v === 0).length;
      totalRight += arr.filter(v => v === 1).length;
      totalDays++;
    });

    return {
      labels: ['Avg Self-Will', 'Avg God\'s Will'],
      datasets: [{ 
        data: [
          totalDays ? totalLeft / totalDays : 0,
          totalDays ? totalRight / totalDays : 0
        ], 
        backgroundColor: ['#ffe69c', '#a3cfbb'],
        borderWidth: 1,
        borderColor: '#000',
        hoverOffset: 0
      }]
    };
  };

  const remainingFields = getRemainingFields();
  const hasData = allData.length > 0;

  return (
    <div className="container my-4">
      <h1 className="text-center">Daily Inventory</h1>
      <p className="text-center">
        When we retire at night, we constructively review our day. Were we resentful, selfish, dishonest, or afraid?
      </p>

      {/* Date Navigation */}
      <div className="row">
        <div className="col text-center">
          <button 
            className="btn btn-primary me-2" 
            onClick={() => adjustDate(-1)}
          >
            &#8592;
          </button>
          <input 
            type="text" 
            className="h3 border-0 bg-transparent text-center" 
            style={{ width: 'auto' }} 
            value={formatDateForDisplay(currentDate)}
            readOnly
          />
          <button 
            className="btn btn-primary ms-2" 
            onClick={() => adjustDate(1)}
          >
            &#8594;
          </button>
          <div className="small text-muted mt-1">Timezone: {userTimezone}</div>
        </div>
      </div>

      {/* Progress Counter */}
      <div className="counter text-center mt-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
        {remainingFields === 0 ? (
          <div className="alert text-center mb-3" role="alert" style={{ backgroundColor: '#a3cfbb', borderColor: '#a3cfbb', color: '#000' }}>
            Daily inventory is complete for {currentDate}
          </div>
        ) : (
          <div className="alert alert-info text-center mb-3" role="alert">
            Answers Remaining: {remainingFields}
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="table-responsive" style={{ maxWidth: '700px', minWidth: '375px', margin: '0 auto' }}>
        <table className="table table-bordered">
          <thead>
            <tr className="table-inventory-header">
              <th className="table-inventory-header">PERSONALITY CHARACTERISTICS OF SELF-WILL</th>
              <th className="table-inventory-header fw-bold">OR</th>
              <th className="table-inventory-header">PERSONALITY CHARACTERISTICS OF GOD'S WILL</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData.map((pair, index) => (
              <tr key={index} data-index={index}>
                {pair[0] === "HOW DO YOU FEEL?" ? (
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
          <button 
            className="btn btn-primary"
            onClick={() => setShowSettingsModal(true)}
          >
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                      <h6 className="mb-3 text-dark">Today's Daily Totals</h6>
                      <div className="chart-container" style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        height: '300px', 
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        <Pie data={getChartData()} options={{
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
                                  size: 12
                                }
                              }
                            }
                          }
                        }} />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-center">
                      <h6 className="mb-3 text-dark">All Daily Totals (Average)</h6>
                      <div className="chart-container" style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        height: '300px', 
                        margin: '0 auto',
                        position: 'relative'
                      }}>
                        <Pie data={getAverageChartData()} options={{
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
                                  size: 12
                                }
                              }
                            }
                          }
                        }} />
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                  <h6><FontAwesomeIcon icon={faMobileAlt} /> iOS (iPhone/iPad)</h6>
                  <ol>
                    <li>Open this website in Safari</li>
                    <li>Tap the Share button <FontAwesomeIcon icon={faShare} /> at the bottom of the screen</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                  </ol>
                </div>

                <div className="mb-4">
                  <h6><FontAwesomeIcon icon={faMobileAlt} /> Android</h6>
                  <ol>
                    <li>Open this website in Chrome</li>
                    <li>Tap the menu button <FontAwesomeIcon icon={faEllipsisV} /> in the top right</li>
                    <li>Tap "Add to Home screen" or "Install app"</li>
                    <li>Follow the prompts to complete installation</li>
                  </ol>
                </div>

                <div className="mb-4">
                  <h6><FontAwesomeIcon icon={faMobileAlt} /> Windows</h6>
                  <ol>
                    <li>Open this website in Microsoft Edge</li>
                    <li>Click the menu button <FontAwesomeIcon icon={faEllipsisV} /> in the top right</li>
                    <li>Click "Apps" and then "Install this site as an app"</li>
                    <li>Click "Install" in the prompt that appears</li>
                  </ol>
                </div>

                <div className="alert alert-info">
                  <FontAwesomeIcon icon={faInfoCircle} /> Once installed, you can access the app directly from your home screen or app drawer, just like a native app!
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                  <button 
                    className="btn btn-primary"
                    title="Export Data"
                    onClick={exportData}
                    disabled={!hasData}
                  >
                    <FontAwesomeIcon icon={faFileExport} className="me-2" />Export Data
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
                    <FontAwesomeIcon icon={faFileExport} style={{ transform: 'rotate(180deg)' }} className="me-2" />Import Data
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setShowResetModal(true)}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="me-2" />Reset All Data
                  </button>
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
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={resetAllData}
                >
                  Confirm
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
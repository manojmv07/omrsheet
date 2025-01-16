import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCol: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontSize: 12,
    fontWeight: 'bold',
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
  }
});

const PDFDocument = ({ results }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Test Results</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeader}>Sl No.</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeader}>USN</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeader}>Score</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableHeader}>Percentage</Text>
            </View>
          </View>
          {results.map((result, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{result.usn}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{result.score}/{result.totalQuestions}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {((result.score / result.totalQuestions) * 100).toFixed(2)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

function Results() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async (testId) => {
    if (!testId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/results/${testId}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      console.log('Fetched results:', data);
      setResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Error fetching results: ' + err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tests on component mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tests');
        if (!response.ok) throw new Error('Failed to fetch tests');
        const data = await response.json();
        setTests(data);
      } catch (err) {
        setError('Error fetching tests: ' + err.message);
      }
    };
    fetchTests();
  }, []);

  // Fetch results when test is selected
  useEffect(() => {
    if (selectedTest) {
      fetchResults(selectedTest);
    }
  }, [selectedTest, fetchResults]);

  const handleExportToExcel = useCallback(() => {
    if (!results || results.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(
      results.map((result, index) => ({
        'Sl No.': index + 1,
        'USN': result.usn,
        'Score': `${result.score}/${result.totalQuestions}`,
        'Percentage': `${((result.score / result.totalQuestions) * 100).toFixed(2)}%`
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "test_results.xlsx");
  }, [results]);

  const handleExportToCSV = useCallback(() => {
    if (!results || results.length === 0) return;
    
    const headers = ['Sl No.', 'USN', 'Score', 'Percentage'];
    const csvData = results.map((result, index) => [
      index + 1,
      result.usn,
      `${result.score}/${result.totalQuestions}`,
      `${((result.score / result.totalQuestions) * 100).toFixed(2)}%`
    ]);

    csvData.unshift(headers);
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'test_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results]);

  const getPieChartData = useCallback((data) => {
    if (!data || data.length === 0) return null;

    const gradeRanges = {
      'A (>= 90%)': 0,
      'B (80-89%)': 0,
      'C (70-79%)': 0,
      'D (60-69%)': 0,
      'F (< 60%)': 0
    };

    data.forEach(result => {
      const percentage = (result.score / result.totalQuestions) * 100;
      if (percentage >= 90) gradeRanges['A (>= 90%)']++;
      else if (percentage >= 80) gradeRanges['B (80-89%)']++;
      else if (percentage >= 70) gradeRanges['C (70-79%)']++;
      else if (percentage >= 60) gradeRanges['D (60-69%)']++;
      else gradeRanges['F (< 60%)']++;
    });

    return {
      labels: Object.keys(gradeRanges),
      datasets: [{
        data: Object.values(gradeRanges),
        backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#f44336'],
        borderColor: ['#388E3C', '#7CB342', '#FFA000', '#F57C00', '#D32F2F'],
        borderWidth: 1
      }]
    };
  }, []);

  const getBarChartData = useCallback((data) => {
    if (!data || data.length === 0) return null;

    const sortedScores = [...data].sort((a, b) => b.score - a.score);
    return {
      labels: sortedScores.map(result => result.usn),
      datasets: [{
        label: 'Score',
        data: sortedScores.map(result => result.score),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }]
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Evaluation Results</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Test:</label>
              <select
                className="w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
              >
                <option value="">Select a test</option>
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.name}
                  </option>
                ))}
              </select>
            </div>

            {results && results.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <PDFDownloadLink
                  document={<PDFDocument results={results} />}
                  fileName="test_results.pdf"
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  {({ loading }) => loading ? 'Generating PDF...' : 'Export to PDF'}
                </PDFDownloadLink>
                <button
                  onClick={handleExportToExcel}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Export to Excel
                </button>
                <button
                  onClick={handleExportToCSV}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Export to CSV
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading results...</p>
            </div>
          ) : results && results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
                  <div className="h-[300px] relative">
                    {getPieChartData(results) ? (
                      <Pie 
                        data={getPieChartData(results)} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              display: true,
                              text: 'Grade Distribution',
                              font: { size: 16 }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
                  <div className="h-[300px] relative">
                    {getBarChartData(results) ? (
                      <Bar 
                        data={getBarChartData(results)} 
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            title: {
                              display: true,
                              text: 'Score Distribution',
                              font: { size: 16 }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.usn}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}/{result.totalQuestions}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((result.score / result.totalQuestions) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : selectedTest ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for this test.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Please select a test to view results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Results;

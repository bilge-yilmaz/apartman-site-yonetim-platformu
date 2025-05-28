import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { aiReportsService, FinancialData, PredictionData, AIInsight, ReportSummary } from '../../services/aiReportsService';

const screenWidth = Dimensions.get('window').width;

export default function AdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    predictionAccuracy: 0,
    trendDirection: 'up'
  });

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      // Gerçek AI raporu oluştur
      const reportData = await aiReportsService.generateAIReport('1', selectedPeriod);
      
      setFinancialData(reportData.financialData);
      setPredictions(reportData.predictions);
      setAiInsights(reportData.insights);
      setSummary(reportData.summary);

    } catch (error) {
      console.error('Rapor verileri yüklenirken hata:', error);
      Alert.alert('Hata', 'Rapor verileri yüklenirken bir hata oluştu. Mock veriler gösteriliyor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'warning-outline';
      case 'error': return 'alert-circle-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'info': return 'information-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'success': return '#10B981';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const incomeExpenseData = {
    labels: financialData.map(item => item.month),
    datasets: [
      {
        data: financialData.map(item => item.income / 1000),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: financialData.map(item => item.expense / 1000),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Gelir (K₺)', 'Gider (K₺)'],
  };

  const predictionAccuracyData = {
    labels: predictions.map(item => item.category.split(' ')[0]),
    datasets: [
      {
        data: predictions.map(item => item.accuracy),
      },
    ],
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>AI raporları hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Raporları</Text>
          <Text style={styles.headerSubtitle}>Yapay zeka destekli finansal analiz</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '3months' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('3months')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '3months' && styles.activePeriodButtonText]}>
              3 Ay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '6months' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('6months')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '6months' && styles.activePeriodButtonText]}>
              6 Ay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === '1year' && styles.activePeriodButton]}
            onPress={() => setSelectedPeriod('1year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === '1year' && styles.activePeriodButtonText]}>
              1 Yıl
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.summaryTitle}>Toplam Gelir</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalIncome)}</Text>
            <Text style={styles.summaryChange}>+5.2% önceki döneme göre</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="trending-down" size={24} color="#EF4444" />
              <Text style={styles.summaryTitle}>Toplam Gider</Text>
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpense)}</Text>
            <Text style={styles.summaryChange}>+2.1% önceki döneme göre</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="analytics" size={24} color="#3B82F6" />
              <Text style={styles.summaryTitle}>Net Kar</Text>
            </View>
            <Text style={[styles.summaryValue, { color: summary.netProfit > 0 ? '#10B981' : '#EF4444' }]}>
              {formatCurrency(summary.netProfit)}
            </Text>
            <Text style={styles.summaryChange}>
              {summary.trendDirection === 'up' ? '↗' : '↘'} Trend {summary.trendDirection === 'up' ? 'yükseliş' : 'düşüş'}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bulb" size={24} color="#8B5CF6" />
              <Text style={styles.summaryTitle}>AI Doğruluk</Text>
            </View>
            <Text style={styles.summaryValue}>%{summary.predictionAccuracy.toFixed(1)}</Text>
            <Text style={styles.summaryChange}>Tahmin başarı oranı</Text>
          </View>
        </View>

        {/* Charts - Basit Görsel Gösterimler */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Gelir vs Gider Trendi</Text>
          <View style={styles.simpleChart}>
            {financialData.map((item, index) => (
              <View key={index} style={styles.chartItem}>
                <Text style={styles.chartMonth}>{item.month}</Text>
                <View style={styles.chartBars}>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar, 
                        styles.incomeBar,
                        { height: (item.income / 1000) * 2 }
                      ]} 
                    />
                    <Text style={styles.chartBarLabel}>{(item.income / 1000).toFixed(0)}K</Text>
                  </View>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar, 
                        styles.expenseBar,
                        { height: (item.expense / 1000) * 2 }
                      ]} 
                    />
                    <Text style={styles.chartBarLabel}>{(item.expense / 1000).toFixed(0)}K</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Gelir</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Gider</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>AI Tahmin Doğruluğu</Text>
          <View style={styles.accuracyChart}>
            {predictions.map((prediction, index) => (
              <View key={index} style={styles.accuracyItem}>
                <Text style={styles.accuracyCategory}>{prediction.category.split(' ')[0]}</Text>
                <View style={styles.accuracyBarContainer}>
                  <View style={styles.accuracyBarBackground}>
                    <View 
                      style={[
                        styles.accuracyBarFill,
                        { width: `${prediction.accuracy}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.accuracyPercentage}>{prediction.accuracy.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>AI Öngörüleri ve Öneriler</Text>
          {aiInsights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                  <Ionicons 
                    name={getInsightIcon(insight.type)} 
                    size={24} 
                    color={getInsightColor(insight.type)} 
                  />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceText}>%{insight.confidence}</Text>
                  <Text style={styles.confidenceLabel}>güven</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              <View style={styles.recommendationContainer}>
                <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
                <Text style={styles.recommendationText}>{insight.recommendation}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Predictions Table */}
        <View style={styles.predictionsContainer}>
          <Text style={styles.sectionTitle}>Detaylı Tahmin Analizi</Text>
          {predictions.map((prediction, index) => (
            <View key={index} style={styles.predictionRow}>
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionCategory}>{prediction.category}</Text>
                <View style={styles.predictionValues}>
                  <Text style={styles.predictionValue}>
                    Tahmin: {formatCurrency(prediction.predicted)}
                  </Text>
                  <Text style={styles.predictionValue}>
                    Gerçek: {formatCurrency(prediction.actual)}
                  </Text>
                </View>
              </View>
              <View style={styles.accuracyContainer}>
                <Text style={[styles.accuracyText, { color: prediction.accuracy > 95 ? '#10B981' : '#F59E0B' }]}>
                  %{prediction.accuracy.toFixed(1)}
                </Text>
                <View style={[styles.accuracyBar, { width: `${prediction.accuracy}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Export Options */}
        <View style={styles.exportContainer}>
          <Text style={styles.sectionTitle}>Rapor İndirme</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportButton}>
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <Text style={styles.exportButtonText}>PDF Raporu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Ionicons name="grid-outline" size={24} color="#3B82F6" />
              <Text style={styles.exportButtonText}>Excel Tablosu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePeriodButtonText: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  summaryCard: {
    width: '48%',
    marginBottom: 16,
    marginRight: '2%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 11,
    color: '#6B7280',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
    paddingVertical: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  insightsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 8,
  },
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  insightDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  predictionsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  predictionValues: {
    flexDirection: 'row',
    gap: 16,
  },
  predictionValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  accuracyContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accuracyBar: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    maxWidth: 50,
  },
  exportContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginBottom: 20,
  },
  exportButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  // Basit Chart Stilleri
  simpleChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 4,
  },
  chartBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  incomeBar: {
    backgroundColor: '#10B981',
  },
  expenseBar: {
    backgroundColor: '#EF4444',
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Accuracy Chart Stilleri
  accuracyChart: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  accuracyItem: {
    marginBottom: 16,
  },
  accuracyCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  accuracyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accuracyBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  accuracyPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    minWidth: 40,
    textAlign: 'right',
  },
}); 
 
 
 
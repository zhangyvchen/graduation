<template>
  <div class="report-page">
    <header class="content-header">
      <h2>{{ year }}届毕业生数据统计报告</h2>
      <el-button @click="goBack">返回批次列表</el-button>
    </header>

    <div class="report-content">
      <div class="report-section">
        <h3>人数统计</h3>
        <el-table :data="graduationDataList" border>
          <el-table-column prop="year" label="毕业年份" width="120" />
          <el-table-column prop="totalGraduates" label="总毕业生数" width="120" />
          <el-table-column prop="employedCount" label="就业人数" width="120" />
          <el-table-column prop="enrolledCount" label="升学人数" width="120" />
        </el-table>
      </div>

      <div class="report-section">
        <h3>比率统计</h3>
        <el-table :data="batchList" border>
          <el-table-column prop="year" label="毕业年份" width="120" />
          <el-table-column prop="totalGraduates" label="总毕业生数" width="120" />
          <el-table-column prop="employmentRate" label="就业率(%)" width="120">
            <template #default="scope">
              {{ scope.row.employmentRate?.toFixed(1) }}%
            </template>
          </el-table-column>
          <el-table-column prop="enrollmentRate" label="升学率(%)" width="120">
            <template #default="scope">
              {{ scope.row.enrollmentRate?.toFixed(1) }}%
            </template>
          </el-table-column>
          <el-table-column prop="averageSalary" label="平均薪资" width="150">
            <template #default="scope">
              ¥{{ scope.row.averageSalary }}
            </template>
          </el-table-column>
          <el-table-column prop="schoolName" label="学校名称" width="150" />
          <el-table-column prop="collegeName" label="学院名称" width="150" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBatchAll, getGraduationDataAll } from '../api/batch'

const route = useRoute()
const router = useRouter()

const year = computed(() => route.params.year)

const graduationDataList = ref([])
const batchList = ref([])

const goBack = () => {
  router.push('/admin/batch')
}

const fetchData = async () => {
  try {
    const [batchRes, dataRes] = await Promise.all([
      getBatchAll(),
      getGraduationDataAll()
    ])

    if (batchRes.code === 200) {
      batchList.value = year.value
        ? batchRes.data.filter(item => item.year == year.value)
        : batchRes.data
    }

    if (dataRes.code === 200) {
      graduationDataList.value = year.value
        ? dataRes.data.filter(item => item.year == year.value)
        : dataRes.data
    }
  } catch (error) {
    console.error('获取数据失败', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.content-header h2 {
  color: #333;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.report-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}


.report-section h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}
</style>
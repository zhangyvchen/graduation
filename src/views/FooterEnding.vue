<script setup>

</script>

<template>
  <div class="footer-ending">
    <!-- 原有的寄语部分 -->
    <div class="ending-section">
      <h2>💚 尾页 · 寄语与展望</h2>
      <div class="ending-grid">
        <div class="ending-card">
          <h4>🎓 院长寄语</h4>
          <p>愿你们以梦为马，不负韶华。在未来的道路上，保持学习的热情，坚守初心的力量，成为社会的栋梁之才。</p>
          <span class="author">—— 院长</span>
        </div>
        <div class="ending-card">
          <h4>🌟 校友寄语</h4>
          <p>毕业不是终点，而是新的起点。感谢母校的培养，愿学弟学妹们在更广阔的天地中绽放光彩。</p>
          <span class="author">—— 校友代表</span>
        </div>
        <div class="ending-card">
          <h4>🚀 未来展望</h4>
          <p>愿每一位毕业生都能在时代的浪潮中找准方向，用智慧和汗水书写属于自己的精彩篇章。</p>
        </div>
      </div>
    </div>

    <!-- ===== 新增：留言墙 ===== -->
    <MessageWall />

    <!-- ===== 新增：明信片生成器 ===== -->
    <PostcardGenerator />
  </div>
</template>

<script setup>
import MessageWall from '../components/MessageWall.vue'
import PostcardGenerator from '../components/PostcardGenerator.vue'
</script>

<style scoped>
.footer-ending {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
}

.ending-section {
  margin-bottom: 32px;
}

.ending-section h2 {
  font-size: 22px;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-left: 16px;
  border-left: 4px solid #667eea;
}

.ending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.ending-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
}

.ending-card:hover {
  transform: translateY(-4px);
}

.ending-card h4 {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 12px;
}

.ending-card p {
  font-size: 15px;
  line-height: 1.8;
  color: #666;
  margin-bottom: 12px;
}

.ending-card .author {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

@media (max-width: 768px) {
  .ending-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped>

</style>
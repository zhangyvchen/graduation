/**
 * 数据故事解说生成器
 * 根据数据自动生成自然语言描述
 */

// 数字美化
const formatNumber = (num) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    if (num >= 1000) return (num / 1000).toFixed(1) + '千'
    return num
}

// 获取趋势描述
const getTrend = (value, threshold = 50) => {
    if (value >= 95) return '非常出色 🎉'
    if (value >= 85) return '表现优秀 👍'
    if (value >= 70) return '处于良好水平 📈'
    if (value >= threshold) return '表现平稳 📊'
    return '有待提升 💪'
}

// 首页解说
export const homeStory = (data) => {
    if (!data || !data.totalGraduates) {
        return '📊 数据加载中，请稍后...'
    }
    const total = formatNumber(data.totalGraduates)
    const emp = data.employmentRate || 0
    const enroll = data.enrollmentRate || 0
    const trend = getTrend(emp)

    let text = `🎙️ 欢迎来到毕业数据报告系统！`
    text += `今年共有 **${total}** 名毕业生，就业率达到 **${emp}%**，${trend}。`
    text += `升学率为 **${enroll}%**，`

    if (enroll > 30) {
        text += `深造热情高涨 🔥`
    } else if (enroll > 20) {
        text += `稳步提升 📈`
    } else {
        text += `还有提升空间 💪`
    }

    if (data.year) {
        text += ` 这是 **${data.year}届** 毕业生的数据全景图。`
    }

    return text
}

// 成长轨迹解说
export const growthStory = (data) => {
    if (!data || !data.honor) {
        return '📊 数据加载中，请稍后...'
    }

    const honor = data.honor || { national: 0, provincial: 0, school: 0, college: 0 }
    const totalHonor = honor.national + honor.provincial + honor.school + honor.college

    let text = `🎙️ 成长轨迹展现了本届毕业生的全面发展情况。`

    if (totalHonor > 0) {
        text += `共获得 **${totalHonor}** 项荣誉奖项，`
        if (honor.national > 0) {
            text += `其中国家级奖项 **${honor.national}** 项，含金量十足 🏆`
        } else if (honor.provincial > 0) {
            text += `省级及以上奖项 **${honor.national + honor.provincial}** 项`
        } else {
            text += `校级奖项 **${honor.school}** 项`
        }
        text += `。`
    }

    // 奖学金
    const scholarship = data.scholarship || []
    if (scholarship.length > 0) {
        const avgRate = scholarship.reduce((s, d) => s + d.rate, 0) / scholarship.length
        text += `奖学金覆盖率达到 **${avgRate.toFixed(1)}%**，`
        if (avgRate > 40) {
            text += `整体学业表现优秀 💰`
        } else if (avgRate > 30) {
            text += `表现良好 📚`
        } else {
            text += `还有提升空间 💪`
        }
        text += `。`
    }

    // 干部和党员
    const cadre = data.cadre || { president: 0, minister: 0, monitor: 0, secretary: 0 }
    const totalCadre = cadre.president + cadre.minister + cadre.monitor + cadre.secretary
    if (totalCadre > 0) {
        text += `共有 **${totalCadre}** 名学生担任过学生干部，`
        text += `展现了良好的领导力和服务意识 👔。`
    }

    const party = data.party || { partyMember: 0, probationary: 0, activist: 0, mass: 0 }
    const totalParty = party.partyMember + party.probationary + party.activist
    if (totalParty > 0) {
        const percent = (totalParty / (totalParty + party.mass) * 100).toFixed(1)
        text += `党员及积极分子占比 **${percent}%**，政治素养优秀 🚩。`
    }

    return text
}

// 去向地图解说
export const destinationStory = (data) => {
    if (!data || !data.heatmap) {
        return '📊 数据加载中，请稍后...'
    }

    let text = `🎙️ 毕业生的足迹遍布全国各地！`

    // 热门省份
    const heatmap = data.heatmap || []
    if (heatmap.length > 0) {
        const sorted = [...heatmap].sort((a, b) => b.value - a.value)
        const top3 = sorted.slice(0, 3)
        const top1 = top3[0]
        text += `最受欢迎的省份是 **${top1.name}**，共有 **${top1.value}** 人选择前往。`
        if (top3.length > 1) {
            text += `其次是 **${top3[1].name}**（${top3[1].value}人）`
            if (top3.length > 2) {
                text += `和 **${top3[2].name}**（${top3[2].value}人）`
            }
            text += `。`
        }
        text += ` 总体呈现 **${sorted.length > 10 ? '广泛分布' : '集中趋势'}** 的特点 🌍。`
    }

    // 行业分布
    const industry = data.industry || []
    if (industry.length > 0) {
        const sorted = [...industry].sort((a, b) => b.value - a.value)
        const top1 = sorted[0]
        text += `就业行业以 **${top1.name}** 为主，占比 **${top1.value}%**。`
        if (sorted.length > 1) {
            text += `其次是 **${sorted[1].name}**（${sorted[1].value}%）`
            if (sorted.length > 2) {
                text += `和 **${sorted[2].name}**（${sorted[2].value}%）`
            }
            text += `。`
        }
    }

    // 入职公司 Top5
    const companies = data.companies || []
    if (companies.length > 0) {
        const top1 = companies[0]
        text += `入职公司中，**${top1.name}** 最受欢迎（${top1.count}人）。`
        if (companies.length > 1) {
            text += `其次是 **${companies[1].name}**（${companies[1].count}人）`
            if (companies.length > 2) {
                text += `和 **${companies[2].name}**（${companies[2].count}人）`
            }
            text += `。`
        }
    }

    return text
}

// 学习画像解说
export const learningStory = (data) => {
    if (!data || !data.gpa) {
        return '📊 数据加载中，请稍后...'
    }

    let text = `🎙️ 学习画像展示了本届毕业生的学术风采！`

    // GPA
    const gpaData = data.gpa || []
    if (gpaData.length > 0) {
        const total = gpaData.reduce((s, d) => s + d.count, 0)
        const highGpa = gpaData.filter(d => {
            const range = d.range
            return range.includes('3.5') || range.includes('3.0')
        }).reduce((s, d) => s + d.count, 0)
        const highPercent = (highGpa / total * 100).toFixed(1)
        text += `GPA在 **3.0以上** 的学生占比 **${highPercent}%**，`
        if (highPercent > 60) {
            text += `学术表现非常优秀 📚✨`
        } else if (highPercent > 40) {
            text += `整体学风扎实 👍`
        } else {
            text += `还有提升空间 💪`
        }
        text += `。`
    }

    // 图书馆借阅
    const library = data.library || []
    if (library.length > 0) {
        const avg = library.reduce((s, d) => s + d.count, 0) / library.length
        const max = library.reduce((s, d) => Math.max(s, d.count), 0)
        text += `人均借阅 **${avg.toFixed(1)}** 本书，`
        if (avg > 50) {
            text += `阅读量惊人，堪称"书虫" 📖🐛`
        } else if (avg > 30) {
            text += `阅读习惯良好 📖`
        } else {
            text += `图书馆欢迎你常来 📚`
        }
        text += `。`
    }

    // 实验室参与
    const lab = data.lab || []
    if (lab.length > 0) {
        const avgRate = lab.reduce((s, d) => s + d.rate, 0) / lab.length
        text += `实验室参与率 **${avgRate.toFixed(1)}%**，`
        if (avgRate > 50) {
            text += `科研热情高涨 🔬`
        } else if (avgRate > 30) {
            text += `实践能力突出 🔬`
        } else {
            text += `期待更多同学走进实验室 💡`
        }
        text += `。`
    }

    // 竞赛
    const competition = data.competition || { international: 0, national: 0, provincial: 0, school: 0 }
    const totalComp = competition.international + competition.national + competition.provincial + competition.school
    if (totalComp > 0) {
        text += `共获得 **${totalComp}** 项竞赛奖项，`
        if (competition.international > 0 || competition.national > 0) {
            text += `其中国际/国家级奖项 **${competition.international + competition.national}** 项，实力非凡 🏅`
        } else {
            text += `获奖覆盖面广泛 🏅`
        }
        text += `！`
    }

    return text
}

// 根据页面类型选择生成器
export const generateStory = (data, pageType) => {
    const map = {
        home: homeStory,
        growth: growthStory,
        destination: destinationStory,
        learning: learningStory
    }
    const generator = map[pageType] || homeStory
    return generator(data)
}
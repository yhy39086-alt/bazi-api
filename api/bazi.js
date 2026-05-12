const { Solar } = require('lunar-javascript');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    const { name = '', gender = '男', year, month, day, hour } = body;
    
    if (!year || !month || !day) {
      return res.status(400).json({ error: '缺少必要参数 year/month/day' });
    }
    
    const validHour = (hour >= 0 && hour <= 23) ? parseInt(hour) : 12;
    const knownHour = (hour >= 0 && hour <= 23);
    
    const solar = Solar.fromYmdHms(
      parseInt(year), parseInt(month), parseInt(day),
      validHour, 0, 0
    );
    const lunar = solar.getLunar();
    const ba = lunar.getEightChar();
    
    const yearGZ = ba.getYear();
    const monthGZ = ba.getMonth();
    const dayGZ = ba.getDay();
    const hourGZ = knownHour ? ba.getTime() : '时辰未明';
    
    // 五行映射
    const ganWuxing = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
    const zhiWuxing = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
    
    const rizhu = dayGZ[0];
    const wuxing = ganWuxing[rizhu];
    
    // 五行统计
    const wxCount = {木:0, 火:0, 土:0, 金:0, 水:0};
    const allGZ = [yearGZ, monthGZ, dayGZ];
    if (knownHour) allGZ.push(hourGZ);
    allGZ.forEach(gz => {
      if (ganWuxing[gz[0]]) wxCount[ganWuxing[gz[0]]]++;
      if (zhiWuxing[gz[1]]) wxCount[zhiWuxing[gz[1]]]++;
    });
    
    const myCount = wxCount[wuxing] || 0;
    const wangshuai = myCount >= 3 ? '偏旺' : (myCount <= 1 ? '偏弱' : '中和');
    const queshi = Object.entries(wxCount).filter(([,v]) => v === 0).map(([k]) => k).join('、') || '无';
    
    // 十神（年/月/时干）
    const shiShen = `年干十神：${ba.getYearShiShenGan()} | 月干十神：${ba.getMonthShiShenGan()}` + 
                    (knownHour ? ` | 时干十神：${ba.getTimeShiShenGan()}` : '');
    
    // 纳音
    const naYin = `${ba.getYearNaYin()} | ${ba.getMonthNaYin()} | ${ba.getDayNaYin()}` +
                  (knownHour ? ` | ${ba.getTimeNaYin()}` : '');
    
    // 农历
    const lunarDate = `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    
    // 大运（需性别）
    let daYun = '时辰未明，无法精准排大运';
    if (knownHour) {
      const yun = ba.getYun(gender === '男' ? 1 : 0);
      const daYunArr = yun.getDaYun();
      daYun = daYunArr.slice(1, 9).map(d => 
        `${d.getStartAge()}-${d.getStartAge()+9}岁 ${d.getGanZhi()}`
      ).join('; ');
    }
    
    res.status(200).json({
      sizhu: `${yearGZ} ${monthGZ} ${dayGZ} ${hourGZ}`,
      yearGZ, monthGZ, dayGZ, hourGZ,
      rizhu, wuxing, wangshuai, queshi,
      wuxing_str: `木${wxCount.木} 火${wxCount.火} 土${wxCount.土} 金${wxCount.金} 水${wxCount.水}`,
      shiShen, naYin, lunarDate, daYun,
      name, gender,
      birth_info: `${year}年${month}月${day}日${knownHour ? hour + '时' : '时辰未知'}`
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
};

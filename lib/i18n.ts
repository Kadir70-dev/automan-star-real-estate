// Interface strings for the language switcher. Listing descriptions, CMS copy and
// neighbourhood guides stay in English; these cover navigation, footer and buyer tools.
export const LANGS=[
 {code:'en',label:'English',short:'EN',dir:'ltr'},
 {code:'ar',label:'العربية',short:'ع',dir:'rtl'},
 {code:'hi',label:'हिन्दी',short:'हि',dir:'ltr'},
] as const;
export type Lang=typeof LANGS[number]['code'];

const en={
 'mort.lede':'See your monthly payment, how much you borrow and the total interest. Move the sliders to compare scenarios.','cost.lede':'Everything you pay on top of the price, the cash you need on the day and the rental yield, in one view.',
 'cost.ltv':'Loan to value',
 'footer.all':'All properties','footer.saved':'Saved properties','footer.compare':'Compare','footer.aboutUs':'About us','footer.privacy':'Privacy policy','footer.heading':'Thinking about a property in Dubai? Start with a conversation.','footer.cta':'Contact the team',
 'nav.properties':'Properties','nav.buy':'Buy','nav.off-plan':'Off-plan','nav.commercial':'Commercial','nav.experience':'3D residence','nav.about':'About','nav.contact':'Contact',
 'nav.areas':'Areas','nav.calculators':'Calculators',
 'prefs.language':'Language','prefs.currency':'Currency',
 'footer.explore':'Explore','footer.more':'More','footer.contact':'Contact','footer.tools':'Buyer tools',
 'footer.mortgage':'Mortgage calculator','footer.costs':'Property cost calculator','footer.areas':'Neighbourhood guides',
 'calc.price':'Property price (AED)','calc.estimate':'Estimates only. Banks, developers and government fees vary, so confirm figures with our team before you commit.',
 'mort.title':'Mortgage calculator','mort.residency':'Buyer profile','mort.resident':'UAE resident (expat)','mort.national':'UAE national','mort.nonresident':'Non-resident',
 'mort.down':'Down payment','mort.rate':'Interest rate (% per year)','mort.years':'Loan term (years)','mort.monthly':'Monthly payment','mort.loan':'Loan amount',
 'mort.interest':'Total interest','mort.total':'Total repaid','mort.min':'Typical minimum down payment for this profile','mort.belowMin':'Below the usual minimum for this profile. Most UAE banks will ask for more.',
 'cost.title':'Property cost calculator','cost.ready':'Ready property','cost.offplan':'Off-plan','cost.status':'Property status','cost.mortgage':'Buying with a mortgage','cost.loan':'Loan amount (AED)',
 'cost.dld':'DLD transfer fee (4%)','cost.admin':'DLD admin fee','cost.trustee':'Registration trustee fee + VAT','cost.agency':'Agency fee (2%) + VAT',
 'cost.mreg':'Mortgage registration (0.25% + AED 290)','cost.bank':'Bank arrangement fee (up to 1%) + VAT','cost.valuation':'Valuation fee (approx.)',
 'cost.upfront':'Estimated fees on top of the price','cost.cash':'Total cash needed at purchase','cost.yield':'Rental yield','cost.rent':'Expected annual rent (AED)','cost.service':'Annual service charge (AED)',
 'cost.gross':'Gross yield','cost.net':'Net yield (after service charge)',
 'tools.ask':'Talk to an advisor',
};
export type Key=keyof typeof en;

const ar:Record<Key,string>={
 'mort.lede':'اعرف قسطك الشهري ومبلغ القرض وإجمالي الفائدة. حرّك المؤشرات لمقارنة السيناريوهات.','cost.lede':'كل ما تدفعه فوق السعر، والنقد المطلوب يوم الشراء، والعائد الإيجاري، في مكان واحد.',
 'cost.ltv':'نسبة التمويل من قيمة العقار',
 'footer.all':'جميع العقارات','footer.saved':'العقارات المحفوظة','footer.compare':'مقارنة','footer.aboutUs':'من نحن','footer.privacy':'سياسة الخصوصية','footer.heading':'تفكر في عقار في دبي؟ ابدأ بمحادثة.','footer.cta':'تواصل مع الفريق',
 'nav.properties':'العقارات','nav.buy':'شراء','nav.off-plan':'على الخريطة','nav.commercial':'تجاري','nav.experience':'جولة ثلاثية الأبعاد','nav.about':'من نحن','nav.contact':'تواصل معنا',
 'nav.areas':'المناطق','nav.calculators':'الحاسبات',
 'prefs.language':'اللغة','prefs.currency':'العملة',
 'footer.explore':'استكشف','footer.more':'المزيد','footer.contact':'تواصل','footer.tools':'أدوات المشتري',
 'footer.mortgage':'حاسبة التمويل العقاري','footer.costs':'حاسبة تكاليف العقار','footer.areas':'أدلة الأحياء',
 'calc.price':'سعر العقار (درهم)','calc.estimate':'تقديرات فقط. تختلف رسوم البنوك والمطورين والجهات الحكومية، لذا يرجى تأكيد الأرقام مع فريقنا قبل الالتزام.',
 'mort.title':'حاسبة التمويل العقاري','mort.residency':'فئة المشتري','mort.resident':'مقيم في الإمارات (وافد)','mort.national':'مواطن إماراتي','mort.nonresident':'غير مقيم',
 'mort.down':'الدفعة الأولى','mort.rate':'نسبة الفائدة (% سنوياً)','mort.years':'مدة القرض (سنوات)','mort.monthly':'القسط الشهري','mort.loan':'مبلغ القرض',
 'mort.interest':'إجمالي الفائدة','mort.total':'إجمالي المبلغ المسدد','mort.min':'الحد الأدنى المعتاد للدفعة الأولى لهذه الفئة','mort.belowMin':'أقل من الحد الأدنى المعتاد لهذه الفئة. معظم البنوك في الإمارات تطلب أكثر.',
 'cost.title':'حاسبة تكاليف العقار','cost.ready':'عقار جاهز','cost.offplan':'على الخريطة','cost.status':'حالة العقار','cost.mortgage':'الشراء بتمويل عقاري','cost.loan':'مبلغ القرض (درهم)',
 'cost.dld':'رسوم نقل الملكية لدى دائرة الأراضي (4%)','cost.admin':'الرسوم الإدارية لدائرة الأراضي','cost.trustee':'رسوم أمين التسجيل + ضريبة القيمة المضافة','cost.agency':'عمولة الوسيط (2%) + ضريبة القيمة المضافة',
 'cost.mreg':'تسجيل الرهن (0.25% + 290 درهم)','cost.bank':'رسوم البنك (حتى 1%) + ضريبة القيمة المضافة','cost.valuation':'رسوم التقييم (تقريبية)',
 'cost.upfront':'الرسوم التقديرية فوق السعر','cost.cash':'إجمالي النقد المطلوب عند الشراء','cost.yield':'العائد الإيجاري','cost.rent':'الإيجار السنوي المتوقع (درهم)','cost.service':'رسوم الخدمات السنوية (درهم)',
 'cost.gross':'العائد الإجمالي','cost.net':'العائد الصافي (بعد رسوم الخدمات)',
 'tools.ask':'تحدث مع مستشار',
};

const hi:Record<Key,string>={
 'mort.lede':'अपनी मासिक किस्त, लोन राशि और कुल ब्याज देखें। अलग-अलग विकल्प देखने के लिए स्लाइडर खिसकाएं।','cost.lede':'कीमत के ऊपर लगने वाला हर खर्च, खरीद के दिन ज़रूरी रकम और किराये का रिटर्न, एक ही जगह।',
 'cost.ltv':'लोन टू वैल्यू (LTV)',
 'footer.all':'सभी प्रॉपर्टीज़','footer.saved':'सेव की गई प्रॉपर्टीज़','footer.compare':'तुलना करें','footer.aboutUs':'हमारे बारे में','footer.privacy':'प्राइवेसी पॉलिसी','footer.heading':'दुबई में प्रॉपर्टी के बारे में सोच रहे हैं? बातचीत से शुरुआत करें।','footer.cta':'टीम से संपर्क करें',
 'nav.properties':'प्रॉपर्टीज़','nav.buy':'खरीदें','nav.off-plan':'ऑफ़-प्लान','nav.commercial':'कमर्शियल','nav.experience':'3D रेज़िडेंस','nav.about':'हमारे बारे में','nav.contact':'संपर्क करें',
 'nav.areas':'इलाके','nav.calculators':'कैलकुलेटर',
 'prefs.language':'भाषा','prefs.currency':'मुद्रा',
 'footer.explore':'देखें','footer.more':'और','footer.contact':'संपर्क','footer.tools':'खरीदार टूल्स',
 'footer.mortgage':'होम लोन कैलकुलेटर','footer.costs':'प्रॉपर्टी लागत कैलकुलेटर','footer.areas':'इलाकों की गाइड',
 'calc.price':'प्रॉपर्टी की कीमत (AED)','calc.estimate':'ये सिर्फ़ अनुमान हैं। बैंक, डेवलपर और सरकारी फ़ीस बदलती रहती हैं, इसलिए फ़ैसला लेने से पहले हमारी टीम से आंकड़े कन्फ़र्म करें।',
 'mort.title':'होम लोन कैलकुलेटर','mort.residency':'खरीदार की श्रेणी','mort.resident':'UAE निवासी (प्रवासी)','mort.national':'UAE नागरिक','mort.nonresident':'गैर-निवासी (जैसे भारत से)',
 'mort.down':'डाउन पेमेंट','mort.rate':'ब्याज दर (% सालाना)','mort.years':'लोन अवधि (साल)','mort.monthly':'मासिक किस्त','mort.loan':'लोन राशि',
 'mort.interest':'कुल ब्याज','mort.total':'कुल भुगतान','mort.min':'इस श्रेणी के लिए आम तौर पर न्यूनतम डाउन पेमेंट','mort.belowMin':'यह इस श्रेणी के आम न्यूनतम से कम है। ज़्यादातर UAE बैंक इससे ज़्यादा मांगेंगे।',
 'cost.title':'प्रॉपर्टी लागत कैलकुलेटर','cost.ready':'रेडी प्रॉपर्टी','cost.offplan':'ऑफ़-प्लान','cost.status':'प्रॉपर्टी की स्थिति','cost.mortgage':'होम लोन के साथ खरीद','cost.loan':'लोन राशि (AED)',
 'cost.dld':'DLD ट्रांसफ़र फ़ीस (4%)','cost.admin':'DLD एडमिन फ़ीस','cost.trustee':'रजिस्ट्रेशन ट्रस्टी फ़ीस + VAT','cost.agency':'एजेंसी फ़ीस (2%) + VAT',
 'cost.mreg':'मॉर्गेज रजिस्ट्रेशन (0.25% + AED 290)','cost.bank':'बैंक प्रोसेसिंग फ़ीस (1% तक) + VAT','cost.valuation':'वैल्यूएशन फ़ीस (लगभग)',
 'cost.upfront':'कीमत के अलावा अनुमानित फ़ीस','cost.cash':'खरीद के समय कुल ज़रूरी रकम','cost.yield':'किराये से रिटर्न','cost.rent':'अनुमानित सालाना किराया (AED)','cost.service':'सालाना सर्विस चार्ज (AED)',
 'cost.gross':'ग्रॉस यील्ड','cost.net':'नेट यील्ड (सर्विस चार्ज के बाद)',
 'tools.ask':'सलाहकार से बात करें',
};

export const DICT:Record<Lang,Record<Key,string>>={en,ar,hi};
export const isLang=(v:unknown):v is Lang=>LANGS.some(l=>l.code===v);

const services=[
{name:"आय प्रमाणपत्र",category:"cert",region:"up",summary:"उत्तर प्रदेश में आय प्रमाणपत्र आवेदन की आधिकारिक जानकारी।",guide:"आवेदन से पहले वर्तमान पात्रता, स्वीकार्य आय प्रमाण और शुल्क e-District पोर्टल पर जाँचें।",url:"https://edistrict.up.gov.in/",portal:"UP e-District"},
{name:"जाति प्रमाणपत्र",category:"cert",region:"up",summary:"जाति प्रमाणपत्र आवेदन और सेवा की जानकारी।",guide:"जाति श्रेणी, स्थानीय पात्रता और दस्तावेज़ों की सूची आधिकारिक पोर्टल से जाँचें।",url:"https://edistrict.up.gov.in/",portal:"UP e-District"},
{name:"निवास प्रमाणपत्र",category:"cert",region:"up",summary:"उत्तर प्रदेश निवास प्रमाणपत्र सेवा की जानकारी।",guide:"निवास संबंधी शर्तें और स्वीकार्य प्रमाण जिले के अनुसार जाँचें।",url:"https://edistrict.up.gov.in/",portal:"UP e-District"},
{name:"जन्म प्रमाणपत्र",category:"family",region:"central",summary:"जन्म पंजीकरण और प्रमाणपत्र की आधिकारिक जानकारी।",guide:"स्थानीय Registrar और राज्य की प्रक्रिया/समयसीमा की पुष्टि करें।",url:"https://crsorgi.gov.in/",portal:"Civil Registration System"},
{name:"मृत्यु प्रमाणपत्र",category:"family",region:"central",summary:"मृत्यु पंजीकरण से संबंधित आधिकारिक सेवा।",guide:"स्थानीय Registrar के निर्देश और लागू समयसीमा जाँचें।",url:"https://crsorgi.gov.in/",portal:"Civil Registration System"},
{name:"राशन कार्ड",category:"family",region:"up",summary:"राशन कार्ड सेवाओं और राज्य खाद्य विभाग की जानकारी।",guide:"नई पात्रता, सदस्य संशोधन और आवेदन प्रक्रिया राज्य पोर्टल पर देखें।",url:"https://fcs.up.gov.in/",portal:"UP Food & Civil Supplies"},
{name:"वृद्धावस्था पेंशन",category:"welfare",region:"up",summary:"उत्तर प्रदेश वृद्धावस्था पेंशन योजना की जानकारी।",guide:"आयु, आय, निवास और आवेदन की मौजूदा शर्तें आधिकारिक पोर्टल पर जाँचें।",url:"https://sspy-up.gov.in/",portal:"UP Social Welfare"},
{name:"विधवा पेंशन",category:"welfare",region:"up",summary:"उत्तर प्रदेश विधवा पेंशन योजना की जानकारी।",guide:"वर्तमान पात्रता और आवेदन निर्देश सरकारी पोर्टल पर जाँचें।",url:"https://sspy-up.gov.in/",portal:"UP Social Welfare"},
{name:"दिव्यांग पेंशन",category:"welfare",region:"up",summary:"उत्तर प्रदेश दिव्यांग पेंशन सेवा की जानकारी।",guide:"दिव्यांगता प्रमाणन, आय और अन्य पात्रता शर्तें आधिकारिक रूप से जाँचें।",url:"https://sspy-up.gov.in/",portal:"UP Social Welfare"},
{name:"छात्रवृत्ति आवेदन",category:"education",region:"central",summary:"केंद्रीय छात्रवृत्ति योजनाओं की जानकारी।",guide:"शैक्षणिक वर्ष, योजना, आय सीमा और संस्थान सत्यापन की शर्तें देखें।",url:"https://scholarships.gov.in/",portal:"National Scholarship Portal"},
{name:"PM-KISAN",category:"farmer",region:"central",summary:"किसान योजना पंजीकरण और लाभार्थी सेवाएँ।",guide:"पात्रता, भूमि रिकॉर्ड और e-KYC की वर्तमान शर्तें आधिकारिक साइट पर जाँचें।",url:"https://pmkisan.gov.in/",portal:"PM-KISAN"},
{name:"खतौनी / भूलेख",category:"land",region:"up",summary:"उत्तर प्रदेश भूमि रिकॉर्ड और खतौनी खोज।",guide:"ऑनलाइन दृश्य प्रति और प्रमाणित प्रति की प्रक्रिया अलग हो सकती है।",url:"https://upbhulekh.gov.in/",portal:"UP Bhulekh"},
{name:"रोजगार पंजीकरण",category:"work",region:"central",summary:"National Career Service पर नौकरी खोजने और पंजीकरण की जानकारी।",guide:"सेवा और पंजीकरण की वर्तमान शर्तें NCS पोर्टल पर देखें।",url:"https://www.ncs.gov.in/",portal:"National Career Service"},
{name:"वोटर ID",category:"identity",region:"central",summary:"मतदाता पंजीकरण, संशोधन और e-EPIC सेवाएँ।",guide:"पात्रता और लागू फॉर्म की जानकारी निर्वाचन आयोग से जाँचें।",url:"https://voters.eci.gov.in/",portal:"Election Commission"},
{name:"Driving Licence",category:"identity",region:"central",summary:"Learner और Driving Licence सेवाओं की जानकारी।",guide:"राज्य चुनकर उपलब्ध सेवाएँ और परीक्षा प्रक्रिया देखें।",url:"https://parivahan.gov.in/",portal:"Parivahan Sewa"}
];
const extraServices=[
  {
    "name": "परिवार रजिस्टर नकल",
    "category": "family",
    "region": "up",
    "summary": "परिवार रजिस्टर की नकल और संबंधित स्थानीय सेवा की जानकारी।",
    "guide": "ग्राम पंचायत/विकास खंड या e-District पर उपलब्धता और प्रक्रिया की पुष्टि करें।",
    "url": "https://edistrict.up.gov.in/",
    "portal": "UP e-District"
  },
  {
    "name": "हैसियत प्रमाणपत्र",
    "category": "cert",
    "region": "up",
    "summary": "हैसियत प्रमाणपत्र सेवा की जानकारी।",
    "guide": "आवेदन का उद्देश्य, निर्धारित प्रारूप और सक्षम प्राधिकारी की पुष्टि करें।",
    "url": "https://edistrict.up.gov.in/",
    "portal": "UP e-District"
  },
  {
    "name": "चरित्र प्रमाणपत्र",
    "category": "cert",
    "region": "up",
    "summary": "चरित्र प्रमाणपत्र संबंधी जानकारी।",
    "guide": "जारी करने वाली संस्था और प्रयोजन के अनुसार प्रक्रिया अलग हो सकती है।",
    "url": "https://edistrict.up.gov.in/",
    "portal": "UP e-District"
  },
  {
    "name": "आयु प्रमाणपत्र",
    "category": "cert",
    "region": "up",
    "summary": "आयु प्रमाण के लिए उपलब्ध सरकारी सेवाओं की जानकारी।",
    "guide": "जन्म प्रमाणपत्र/शैक्षणिक रिकॉर्ड जैसे स्वीकार्य प्रमाण संबंधित संस्था से जाँचें।",
    "url": "https://edistrict.up.gov.in/",
    "portal": "UP e-District"
  },
  {
    "name": "विकलांगता प्रमाणपत्र",
    "category": "welfare",
    "region": "central",
    "summary": "दिव्यांगता प्रमाणन और UDID संबंधी जानकारी।",
    "guide": "चिकित्सकीय मूल्यांकन और अधिकृत केंद्र की वर्तमान प्रक्रिया देखें।",
    "url": "https://www.swavlambancard.gov.in/",
    "portal": "UDID Portal"
  },
  {
    "name": "ई-श्रम कार्ड",
    "category": "work",
    "region": "central",
    "summary": "असंगठित श्रमिकों के e-Shram पंजीकरण की जानकारी।",
    "guide": "पात्रता और पंजीकरण की शर्तें आधिकारिक पोर्टल पर जाँचें।",
    "url": "https://eshram.gov.in/",
    "portal": "e-Shram"
  },
  {
    "name": "EPFO PF पासबुक",
    "category": "work",
    "region": "central",
    "summary": "EPFO सदस्य की PF पासबुक देखने की जानकारी।",
    "guide": "सुरक्षित EPFO सदस्य पोर्टल पर उपलब्ध सेवा और लॉगिन निर्देश देखें।",
    "url": "https://www.epfindia.gov.in/",
    "portal": "EPFO"
  },
  {
    "name": "EPFO क्लेम स्थिति",
    "category": "work",
    "region": "central",
    "summary": "PF क्लेम स्थिति और सदस्य सेवाओं की जानकारी।",
    "guide": "क्लेम प्रकार और स्थिति केवल आधिकारिक EPFO पोर्टल पर देखें।",
    "url": "https://www.epfindia.gov.in/",
    "portal": "EPFO"
  },
  {
    "name": "पासपोर्ट आवेदन",
    "category": "identity",
    "region": "central",
    "summary": "पासपोर्ट सेवा और आवेदन प्रक्रिया की जानकारी।",
    "guide": "आवेदन श्रेणी, शुल्क, अपॉइंटमेंट और दस्तावेज़ आधिकारिक पोर्टल पर जाँचें।",
    "url": "https://www.passportindia.gov.in/",
    "portal": "Passport Seva"
  },
  {
    "name": "PAN कार्ड आवेदन",
    "category": "identity",
    "region": "central",
    "summary": "PAN आवेदन और सुधार की आधिकारिक जानकारी।",
    "guide": "अधिकृत PAN सेवा प्रदाता और लागू शुल्क की पुष्टि करें।",
    "url": "https://www.incometax.gov.in/",
    "portal": "Income Tax e-Filing"
  },
  {
    "name": "आधार अपडेट",
    "category": "identity",
    "region": "central",
    "summary": "Aadhaar विवरण अपडेट और सेवा केंद्र की जानकारी।",
    "guide": "अपडेट का प्रकार, शुल्क और केंद्र UIDAI से जाँचें।",
    "url": "https://uidai.gov.in/",
    "portal": "UIDAI"
  },
  {
    "name": "DigiLocker दस्तावेज़",
    "category": "identity",
    "region": "central",
    "summary": "डिजिटल दस्तावेज़ प्राप्त करने की जानकारी।",
    "guide": "केवल जारीकर्ता द्वारा उपलब्ध दस्तावेज़ ही DigiLocker में मिलेंगे।",
    "url": "https://www.digilocker.gov.in/",
    "portal": "DigiLocker"
  },
  {
    "name": "विवाह पंजीकरण",
    "category": "family",
    "region": "up",
    "summary": "उत्तर प्रदेश विवाह पंजीकरण की जानकारी।",
    "guide": "लागू नियम, पात्रता, दस्तावेज़ और प्रक्रिया सरकारी पोर्टल पर जाँचें।",
    "url": "https://igrsup.gov.in/",
    "portal": "IGRSUP"
  },
  {
    "name": "संपत्ति पंजीकरण",
    "category": "land",
    "region": "up",
    "summary": "उत्तर प्रदेश संपत्ति/विलेख पंजीकरण की जानकारी।",
    "guide": "स्टाम्प शुल्क, पंजीकरण शुल्क और अपॉइंटमेंट की पुष्टि करें।",
    "url": "https://igrsup.gov.in/",
    "portal": "IGRSUP"
  },
  {
    "name": "स्टाम्प एवं पंजीकरण",
    "category": "land",
    "region": "up",
    "summary": "स्टाम्प और पंजीकरण विभाग की सेवाओं की जानकारी।",
    "guide": "विलेख के प्रकार के अनुसार आधिकारिक शुल्क/नियम देखें।",
    "url": "https://igrsup.gov.in/",
    "portal": "IGRSUP"
  },
  {
    "name": "भू-नक्शा उत्तर प्रदेश",
    "category": "land",
    "region": "up",
    "summary": "उत्तर प्रदेश भू-नक्शा देखने की जानकारी।",
    "guide": "नक्शे की ऑनलाइन प्रति और प्रमाणित रिकॉर्ड में अंतर समझें।",
    "url": "https://upbhunaksha.gov.in/",
    "portal": "UP BhuNaksha"
  },
  {
    "name": "खसरा खतौनी",
    "category": "land",
    "region": "up",
    "summary": "भूमि रिकॉर्ड खोजने की जानकारी।",
    "guide": "गाटा/खाता विवरण सावधानी से जाँचें; प्रमाणित प्रति के नियम अलग हो सकते हैं।",
    "url": "https://upbhulekh.gov.in/",
    "portal": "UP Bhulekh"
  },
  {
    "name": "नामांतरण आवेदन",
    "category": "land",
    "region": "up",
    "summary": "भूमि रिकॉर्ड में नामांतरण प्रक्रिया की जानकारी।",
    "guide": "तहसील/राजस्व विभाग के वर्तमान आदेश और आवेदन स्थिति देखें।",
    "url": "https://vaad.up.nic.in/",
    "portal": "UP Revenue Court"
  },
  {
    "name": "राजस्व वाद स्थिति",
    "category": "land",
    "region": "up",
    "summary": "उत्तर प्रदेश राजस्व न्यायालय वाद की जानकारी।",
    "guide": "वाद संख्या और पक्षकार विवरण आधिकारिक पोर्टल पर जाँचें।",
    "url": "https://vaad.up.nic.in/",
    "portal": "UP Revenue Court"
  },
  {
    "name": "बिजली बिल भुगतान",
    "category": "family",
    "region": "up",
    "summary": "उत्तर प्रदेश बिजली बिल और उपभोक्ता सेवाओं की जानकारी।",
    "guide": "अपने DISCOM और उपभोक्ता श्रेणी के अनुसार आधिकारिक साइट चुनें।",
    "url": "https://www.upenergy.in/",
    "portal": "UP Energy"
  },
  {
    "name": "बिजली कनेक्शन आवेदन",
    "category": "family",
    "region": "up",
    "summary": "नए बिजली कनेक्शन की जानकारी।",
    "guide": "क्षेत्रीय DISCOM से उपलब्धता, शुल्क और आवश्यक दस्तावेज़ की पुष्टि करें।",
    "url": "https://www.upenergy.in/",
    "portal": "UP Energy"
  },
  {
    "name": "पानी कनेक्शन",
    "category": "family",
    "region": "up",
    "summary": "स्थानीय जलापूर्ति कनेक्शन सेवाओं की जानकारी।",
    "guide": "नगर निकाय/जल संस्थान की स्थानीय प्रक्रिया और शुल्क जाँचें।",
    "url": "https://e-nagarsewaup.gov.in/",
    "portal": "UP e-Nagar Sewa"
  },
  {
    "name": "जन्म-मृत्यु प्रमाणपत्र स्थिति",
    "category": "family",
    "region": "central",
    "summary": "जन्म-मृत्यु पंजीकरण और प्रमाणपत्र स्थिति की जानकारी।",
    "guide": "स्थानीय Registrar और राज्य के पोर्टल से रिकॉर्ड की स्थिति जाँचें।",
    "url": "https://crsorgi.gov.in/",
    "portal": "Civil Registration System"
  },
  {
    "name": "नगर निकाय सेवाएँ",
    "category": "family",
    "region": "up",
    "summary": "उत्तर प्रदेश नगर निकाय की ऑनलाइन नागरिक सेवाएँ।",
    "guide": "नगर निकाय के अनुसार उपलब्ध सेवाएँ और शुल्क अलग हो सकते हैं।",
    "url": "https://e-nagarsewaup.gov.in/",
    "portal": "UP e-Nagar Sewa"
  },
  {
    "name": "व्यापार लाइसेंस",
    "category": "work",
    "region": "up",
    "summary": "नगर निकाय व्यापार लाइसेंस की जानकारी।",
    "guide": "व्यवसाय प्रकार और नगर निकाय के नियम/शुल्क की पुष्टि करें।",
    "url": "https://e-nagarsewaup.gov.in/",
    "portal": "UP e-Nagar Sewa"
  },
  {
    "name": "जन्म प्रमाणपत्र डाउनलोड",
    "category": "family",
    "region": "up",
    "summary": "जन्म प्रमाणपत्र रिकॉर्ड/कॉपी प्राप्त करने की जानकारी।",
    "guide": "रिकॉर्ड उपलब्धता और डाउनलोड नियम स्थानीय Registrar से जाँचें।",
    "url": "https://crsorgi.gov.in/",
    "portal": "Civil Registration System"
  },
  {
    "name": "मृत्यु प्रमाणपत्र डाउनलोड",
    "category": "family",
    "region": "up",
    "summary": "मृत्यु प्रमाणपत्र रिकॉर्ड/कॉपी प्राप्त करने की जानकारी।",
    "guide": "रिकॉर्ड उपलब्धता और डाउनलोड नियम स्थानीय Registrar से जाँचें।",
    "url": "https://crsorgi.gov.in/",
    "portal": "Civil Registration System"
  },
  {
    "name": "छात्रवृत्ति उत्तर प्रदेश",
    "category": "education",
    "region": "up",
    "summary": "उत्तर प्रदेश छात्रवृत्ति योजनाओं की जानकारी।",
    "guide": "कक्षा/कोर्स, श्रेणी, आय और शैक्षणिक वर्ष की शर्तें आधिकारिक पोर्टल पर देखें।",
    "url": "https://scholarship.up.gov.in/",
    "portal": "UP Scholarship"
  },
  {
    "name": "छात्रवृत्ति स्थिति",
    "category": "education",
    "region": "up",
    "summary": "छात्रवृत्ति आवेदन की स्थिति जाँचने की जानकारी।",
    "guide": "आवेदन संख्या और शैक्षणिक वर्ष के अनुसार आधिकारिक पोर्टल पर स्थिति देखें।",
    "url": "https://scholarship.up.gov.in/",
    "portal": "UP Scholarship"
  },
  {
    "name": "परीक्षा परिणाम UP",
    "category": "education",
    "region": "up",
    "summary": "उत्तर प्रदेश बोर्ड परीक्षा परिणाम की जानकारी।",
    "guide": "केवल बोर्ड की आधिकारिक वेबसाइट पर परिणाम और सूचना सत्यापित करें।",
    "url": "https://upmsp.edu.in/",
    "portal": "UPMSP"
  },
  {
    "name": "UP Board प्रमाणपत्र",
    "category": "education",
    "region": "up",
    "summary": "UP Board मार्कशीट/प्रमाणपत्र संबंधी जानकारी।",
    "guide": "डुप्लीकेट/सुधार प्रक्रिया और शुल्क बोर्ड से जाँचें।",
    "url": "https://upmsp.edu.in/",
    "portal": "UPMSP"
  },
  {
    "name": "विश्वविद्यालय प्रवेश",
    "category": "education",
    "region": "up",
    "summary": "उत्तर प्रदेश उच्च शिक्षा प्रवेश सूचना की जानकारी।",
    "guide": "विश्वविद्यालय की आधिकारिक admission notice और तारीखें देखें।",
    "url": "https://www.up.gov.in/",
    "portal": "Government of Uttar Pradesh"
  },
  {
    "name": "राष्ट्रीय छात्रवृत्ति पोर्टल",
    "category": "education",
    "region": "central",
    "summary": "केंद्रीय छात्रवृत्ति योजनाओं का आधिकारिक पोर्टल।",
    "guide": "योजना-विशिष्ट पात्रता और आवेदन अवधि जाँचें।",
    "url": "https://scholarships.gov.in/",
    "portal": "National Scholarship Portal"
  },
  {
    "name": "स्किल इंडिया प्रशिक्षण",
    "category": "education",
    "region": "central",
    "summary": "कौशल प्रशिक्षण और प्रमाणन सेवाओं की जानकारी।",
    "guide": "प्रशिक्षण केंद्र, कोर्स और प्रमाणन की मान्यता सत्यापित करें।",
    "url": "https://www.skillindiadigital.gov.in/",
    "portal": "Skill India Digital"
  },
  {
    "name": "अप्रेंटिसशिप पंजीकरण",
    "category": "work",
    "region": "central",
    "summary": "अप्रेंटिसशिप अवसर और पंजीकरण की जानकारी।",
    "guide": "आयु, योग्यता, प्रतिष्ठान और अनुबंध शर्तें आधिकारिक पोर्टल पर देखें।",
    "url": "https://www.apprenticeshipindia.gov.in/",
    "portal": "Apprenticeship India"
  },
  {
    "name": "NCS नौकरी खोज",
    "category": "work",
    "region": "central",
    "summary": "National Career Service पर नौकरी खोजने की जानकारी।",
    "guide": "किसी नौकरी के लिए भुगतान/OTP साझा करने से बचें; आधिकारिक NCS ही उपयोग करें।",
    "url": "https://www.ncs.gov.in/",
    "portal": "National Career Service"
  },
  {
    "name": "रोजगार मेला सूचना",
    "category": "work",
    "region": "up",
    "summary": "उत्तर प्रदेश रोजगार मेलों की आधिकारिक जानकारी खोजें।",
    "guide": "जिला रोजगार कार्यालय/सेवायोजन पोर्टल पर ताजा कार्यक्रम देखें।",
    "url": "https://sewayojan.up.nic.in/",
    "portal": "UP Sewayojan"
  },
  {
    "name": "UP सेवायोजन पंजीकरण",
    "category": "work",
    "region": "up",
    "summary": "उत्तर प्रदेश सेवायोजन पोर्टल पर पंजीकरण की जानकारी।",
    "guide": "पंजीकरण और रिक्तियों की शर्तें पोर्टल पर जाँचें।",
    "url": "https://sewayojan.up.nic.in/",
    "portal": "UP Sewayojan"
  },
  {
    "name": "किसान पंजीकरण UP",
    "category": "farmer",
    "region": "up",
    "summary": "उत्तर प्रदेश किसान पंजीकरण और कृषि सेवाओं की जानकारी।",
    "guide": "योजना/फसल के अनुसार विभागीय पोर्टल और पात्रता देखें।",
    "url": "https://upagriculture.com/",
    "portal": "UP Agriculture"
  },
  {
    "name": "कृषि अनुदान",
    "category": "farmer",
    "region": "up",
    "summary": "कृषि विभाग की अनुदान योजनाओं की जानकारी।",
    "guide": "योजना की अधिसूचना, आवेदन अवधि और उपलब्ध बजट की पुष्टि करें।",
    "url": "https://upagriculture.com/",
    "portal": "UP Agriculture"
  },
  {
    "name": "फसल बीमा योजना",
    "category": "farmer",
    "region": "central",
    "summary": "प्रधानमंत्री फसल बीमा योजना की जानकारी।",
    "guide": "फसल, मौसम, क्षेत्र और नामांकन की अंतिम तिथि आधिकारिक रूप से जाँचें।",
    "url": "https://pmfby.gov.in/",
    "portal": "PMFBY"
  },
  {
    "name": "किसान क्रेडिट कार्ड",
    "category": "farmer",
    "region": "central",
    "summary": "Kisan Credit Card योजना की सामान्य जानकारी।",
    "guide": "बैंक और कृषि विभाग से पात्रता, ब्याज/शर्तें और दस्तावेज़ सत्यापित करें।",
    "url": "https://www.myscheme.gov.in/",
    "portal": "myScheme"
  },
  {
    "name": "मृदा स्वास्थ्य कार्ड",
    "category": "farmer",
    "region": "central",
    "summary": "मृदा परीक्षण और Soil Health Card की जानकारी।",
    "guide": "स्थानीय कृषि विभाग/प्रयोगशाला से नमूना और सेवा प्रक्रिया पूछें।",
    "url": "https://soilhealth.dac.gov.in/",
    "portal": "Soil Health Card"
  },
  {
    "name": "ई-नाम किसान बाजार",
    "category": "farmer",
    "region": "central",
    "summary": "e-NAM कृषि मंडी प्लेटफॉर्म की जानकारी।",
    "guide": "मंडी/उत्पाद उपलब्धता और पंजीकरण की शर्तें पोर्टल पर देखें।",
    "url": "https://www.enam.gov.in/",
    "portal": "e-NAM"
  },
  {
    "name": "PM आवास योजना ग्रामीण",
    "category": "welfare",
    "region": "central",
    "summary": "ग्रामीण आवास योजना की जानकारी।",
    "guide": "लाभार्थी चयन और पात्रता ग्राम पंचायत/आधिकारिक पोर्टल से सत्यापित करें।",
    "url": "https://pmayg.nic.in/",
    "portal": "PMAY-G"
  },
  {
    "name": "PM आवास योजना शहरी",
    "category": "welfare",
    "region": "central",
    "summary": "शहरी आवास योजना की जानकारी।",
    "guide": "वर्तमान योजना चरण, पात्रता और नगर निकाय प्रक्रिया जाँचें।",
    "url": "https://pmay-urban.gov.in/",
    "portal": "PMAY-U"
  },
  {
    "name": "आयुष्मान भारत कार्ड",
    "category": "welfare",
    "region": "central",
    "summary": "PM-JAY लाभार्थी और कार्ड सेवाओं की जानकारी।",
    "guide": "पात्रता और अस्पताल सूची आधिकारिक beneficiary portal पर जाँचें।",
    "url": "https://beneficiary.nha.gov.in/",
    "portal": "Ayushman Bharat"
  },
  {
    "name": "जन औषधि केंद्र जानकारी",
    "category": "welfare",
    "region": "central",
    "summary": "प्रधानमंत्री भारतीय जनऔषधि परियोजना की जानकारी।",
    "guide": "केंद्र की उपलब्धता और उत्पाद विवरण आधिकारिक पोर्टल पर देखें।",
    "url": "https://janaushadhi.gov.in/",
    "portal": "Jan Aushadhi"
  },
  {
    "name": "विकलांगता UDID स्थिति",
    "category": "welfare",
    "region": "central",
    "summary": "UDID आवेदन और कार्ड स्थिति की जानकारी।",
    "guide": "आवेदन की स्थिति केवल आधिकारिक UDID पोर्टल पर देखें।",
    "url": "https://www.swavlambancard.gov.in/",
    "portal": "UDID Portal"
  },
  {
    "name": "पेंशन जीवन प्रमाणपत्र",
    "category": "welfare",
    "region": "central",
    "summary": "डिजिटल जीवन प्रमाणपत्र की जानकारी।",
    "guide": "पेंशन वितरण एजेंसी की स्वीकृत प्रक्रिया और विकल्प जाँचें।",
    "url": "https://jeevanpramaan.gov.in/",
    "portal": "Jeevan Pramaan"
  },
  {
    "name": "वोटर पंजीकरण",
    "category": "identity",
    "region": "central",
    "summary": "मतदाता सूची में नाम जोड़ने की जानकारी।",
    "guide": "आयु, पात्रता और लागू फॉर्म निर्वाचन आयोग से सत्यापित करें।",
    "url": "https://voters.eci.gov.in/",
    "portal": "Voters' Service Portal"
  },
  {
    "name": "वोटर कार्ड सुधार",
    "category": "identity",
    "region": "central",
    "summary": "मतदाता विवरण संशोधन की जानकारी।",
    "guide": "सही फॉर्म और आवश्यक प्रमाण निर्वाचन आयोग के पोर्टल पर देखें।",
    "url": "https://voters.eci.gov.in/",
    "portal": "Voters' Service Portal"
  },
  {
    "name": "मतदाता सूची खोज",
    "category": "identity",
    "region": "central",
    "summary": "मतदाता सूची में नाम खोजने की जानकारी।",
    "guide": "राज्य/विधानसभा क्षेत्र चुनकर आधिकारिक निर्वाचन पोर्टल पर जाँचें।",
    "url": "https://electoralsearch.eci.gov.in/",
    "portal": "Electoral Search"
  },
  {
    "name": "ड्राइविंग लाइसेंस स्थिति",
    "category": "identity",
    "region": "central",
    "summary": "Driving Licence आवेदन और स्थिति की जानकारी।",
    "guide": "राज्य परिवहन विभाग और Parivahan पोर्टल पर वर्तमान चरण देखें।",
    "url": "https://parivahan.gov.in/",
    "portal": "Parivahan Sewa"
  },
  {
    "name": "वाहन पंजीकरण",
    "category": "identity",
    "region": "central",
    "summary": "वाहन पंजीकरण सेवाओं की जानकारी।",
    "guide": "राज्य, वाहन वर्ग और RTO के अनुसार प्रक्रिया/शुल्क जाँचें।",
    "url": "https://parivahan.gov.in/",
    "portal": "Parivahan Sewa"
  },
  {
    "name": "वाहन चालान",
    "category": "identity",
    "region": "central",
    "summary": "ई-चालान स्थिति और भुगतान की आधिकारिक जानकारी।",
    "guide": "वाहन/चालान विवरण केवल आधिकारिक पोर्टल पर जाँचें।",
    "url": "https://echallan.parivahan.gov.in/",
    "portal": "eChallan"
  },
  {
    "name": "पासपोर्ट आवेदन स्थिति",
    "category": "identity",
    "region": "central",
    "summary": "पासपोर्ट आवेदन की स्थिति जाँचने की जानकारी।",
    "guide": "आवेदन संदर्भ संख्या केवल आधिकारिक Passport Seva पर उपयोग करें।",
    "url": "https://www.passportindia.gov.in/",
    "portal": "Passport Seva"
  },
  {
    "name": "PAN आवेदन स्थिति",
    "category": "identity",
    "region": "central",
    "summary": "PAN आवेदन/सुधार स्थिति जाँचने की जानकारी।",
    "guide": "आवेदन संदर्भ और स्थिति अधिकृत PAN सेवा पर सत्यापित करें।",
    "url": "https://www.incometax.gov.in/",
    "portal": "Income Tax e-Filing"
  },
  {
    "name": "आयकर रिफंड स्थिति",
    "category": "identity",
    "region": "central",
    "summary": "Income Tax refund status की जानकारी।",
    "guide": "अपने खाते में सुरक्षित login करके आधिकारिक स्थिति देखें।",
    "url": "https://www.incometax.gov.in/",
    "portal": "Income Tax e-Filing"
  },
  {
    "name": "GST पंजीकरण",
    "category": "work",
    "region": "central",
    "summary": "GST registration की जानकारी।",
    "guide": "व्यवसाय प्रकार और लागू नियम GST पोर्टल पर जाँचें।",
    "url": "https://www.gst.gov.in/",
    "portal": "GST Portal"
  },
  {
    "name": "Udyam MSME पंजीकरण",
    "category": "work",
    "region": "central",
    "summary": "MSME Udyam पंजीकरण की जानकारी।",
    "guide": "पंजीकरण की पात्रता और आधिकारिक प्रक्रिया Udyam पोर्टल पर देखें।",
    "url": "https://udyamregistration.gov.in/",
    "portal": "Udyam Registration"
  }
];
services.push(...extraServices);
const categoryLabels={cert:"प्रमाणपत्र",family:"परिवार और राशन",education:"शिक्षा",welfare:"पेंशन और कल्याण",farmer:"किसान",land:"भूमि",work:"रोजगार",identity:"पहचान"};
const serviceGuides={
cert:{documents:"पहचान प्रमाण (जैसे वोटर ID), पते का प्रमाण, स्व-घोषणा और सेवा के अनुसार सहायक प्रमाण। आय प्रमाणपत्र में आय/वेतन का प्रमाण; जाति प्रमाणपत्र में जाति से जुड़ा उपलब्ध प्रमाण; निवास प्रमाणपत्र में निवास का प्रमाण माँगा जा सकता है।",eligibility:"आवेदक का उत्तर प्रदेश से संबंधित होना और प्रमाणपत्र की सेवा-विशेष शर्तें पूरी करना आवश्यक है। जाति, आय और निवास की शर्तें अलग-अलग हैं; अंतिम पात्रता e-District पर जाँचें।",steps:"1. UP e-District/e-Sathi खोलें और Citizen Login/पंजीकरण चुनें। 2. जिला और संबंधित प्रमाणपत्र सेवा चुनें। 3. फॉर्म में नाम, पता और आवश्यक विवरण भरें। 4. पोर्टल द्वारा माँगे गए दस्तावेज़ अपलोड करें। 5. दिखाई गई फीस हो तो पोर्टल पर भुगतान करें। 6. आवेदन संख्या सुरक्षित रखें और स्थिति देखें। 7. सत्यापन/स्वीकृति के बाद प्रमाणपत्र डाउनलोड करें।"},
family:{documents:"परिवार के सदस्यों के पहचान व पते के प्रमाण, परिवार/राशन कार्ड विवरण और सेवा के अनुसार जन्म/मृत्यु का अस्पताल रिकॉर्ड, डिस्चार्ज/मृत्यु संबंधी प्रमाण या स्थानीय निकाय का रिकॉर्ड।",eligibility:"सेवा के अनुसार परिवार का संबंधित राज्य/नगर निकाय/ग्राम पंचायत में रिकॉर्ड होना चाहिए। जन्म-मृत्यु पंजीकरण घटना के स्थान और Registrar के अधिकार क्षेत्र पर निर्भर करता है।",steps:"1. संबंधित e-District, Civil Registration या UP Food पोर्टल खोलें। 2. जन्म/मृत्यु/राशन/परिवार सेवा चुनें। 3. व्यक्ति और परिवार का सही विवरण भरें। 4. आवश्यक प्रमाण अपलोड करें या स्थानीय Registrar/कार्यालय में प्रस्तुत करें। 5. आवेदन जमा कर रसीद/नंबर रखें। 6. पोर्टल या कार्यालय से स्थिति जाँचें और उपलब्ध होने पर प्रमाणपत्र/कार्ड प्राप्त करें।"},
education:{documents:"छात्र का आधार/पहचान, वर्तमान प्रवेश/संस्थान प्रमाण, पिछली कक्षा की अंकतालिका, बैंक खाते का विवरण और योजना के अनुसार आय/जाति प्रमाणपत्र।",eligibility:"छात्र का मान्यता प्राप्त संस्थान/कक्षा में अध्ययन, निर्धारित अंक, आय सीमा, श्रेणी और चालू शैक्षणिक वर्ष की योजना शर्तें लागू हो सकती हैं।",steps:"1. संबंधित राज्य/राष्ट्रीय छात्रवृत्ति पोर्टल खोलें। 2. चालू शैक्षणिक वर्ष और सही योजना चुनें। 3. छात्र पंजीकरण करें और आवेदन भरें। 4. अंकतालिका, प्रवेश और पात्रता प्रमाण अपलोड करें। 5. बैंक विवरण सावधानी से भरें। 6. अंतिम सबमिशन से पहले Preview जाँचें। 7. संस्थान/विभाग सत्यापन और आवेदन स्थिति पोर्टल पर देखें।"},
welfare:{documents:"आधार/पहचान, निवास प्रमाण, बैंक पासबुक/खाता विवरण, आय प्रमाण और योजना के अनुसार आयु प्रमाण, मृत्यु/विधवा प्रमाण या दिव्यांगता प्रमाणपत्र।",eligibility:"योजना के अनुसार आयु, आय, निवास, वैवाहिक स्थिति या प्रमाणित दिव्यांगता जैसी शर्तें लागू होती हैं। केवल संबंधित योजना की वर्तमान सरकारी पात्रता निर्णायक है।",steps:"1. UP Integrated Pension/संबंधित योजना पोर्टल खोलें। 2. योजना का नाम और पात्रता पढ़ें। 3. नया आवेदन/पंजीकरण चुनें। 4. आवेदक, बैंक और परिवार का विवरण भरें। 5. योजना द्वारा माँगे गए दस्तावेज़ अपलोड करें। 6. आवेदन संख्या सुरक्षित रखें। 7. सत्यापन और भुगतान/स्थिति पोर्टल पर जाँचें।"},
farmer:{documents:"किसान/भूमिधर का पहचान व पता प्रमाण, बैंक खाता, मोबाइल नंबर और योजना के अनुसार खतौनी/भूमि रिकॉर्ड, फसल या कृषि गतिविधि का विवरण।",eligibility:"किसान योजना के अनुसार भूमि स्वामित्व, जोत, फसल, राज्य सत्यापन और अपात्रता संबंधी शर्तें अलग हो सकती हैं। PM-KISAN में पात्रता आधिकारिक दिशा-निर्देशों से जाँचें।",steps:"1. संबंधित कृषि/योजना पोर्टल खोलें। 2. योजना की पात्रता और अपात्रता पढ़ें। 3. Farmer Registration/Farmer Corner या आवेदन विकल्प चुनें। 4. पहचान, भूमि और बैंक विवरण भरें। 5. आवश्यक दस्तावेज़ अपलोड/सत्यापित करें। 6. e-KYC जहाँ आवश्यक हो पूरा करें। 7. पंजीकरण/आवेदन स्थिति और भुगतान विवरण देखें।"},
land:{documents:"खाता/गाटा/खसरा संख्या, खतौनी, पहचान व पता प्रमाण और मामले के अनुसार रजिस्ट्री, विरासत/मृत्यु प्रमाण, वसीयत या न्यायालय/राजस्व आदेश।",eligibility:"भूमि रिकॉर्ड देखने के लिए सही जिला, तहसील, ग्राम और खाता/गाटा विवरण चाहिए। नामांतरण/वाद/पंजीकरण के लिए अधिकार, हित और लागू राजस्व/पंजीकरण नियम देखे जाते हैं।",steps:"1. UP Bhulekh/Board of Revenue/IGRSUP/राजस्व न्यायालय पोर्टल खोलें। 2. जिला, तहसील और ग्राम चुनें। 3. खाता/गाटा/वाद संख्या से रिकॉर्ड खोजें। 4. आवेदन सेवा हो तो निर्देश पढ़कर विवरण और दस्तावेज़ जमा करें। 5. रसीद/वाद संख्या सुरक्षित रखें। 6. आदेश/स्थिति पोर्टल पर देखें। प्रमाणित प्रति की प्रक्रिया अलग हो सकती है।"},
work:{documents:"आधार/पहचान, मोबाइल, बैंक विवरण, पता प्रमाण और सेवा के अनुसार शैक्षणिक प्रमाणपत्र, कौशल/अनुभव, श्रमिक विवरण या UAN।",eligibility:"रोजगार, श्रमिक और व्यावसायिक पंजीकरण की पात्रता अलग-अलग है; आयु, रोजगार स्थिति, व्यवसाय प्रकार और योजना के नियम आधिकारिक पोर्टल पर जाँचें।",steps:"1. संबंधित NCS/UP Sewayojan/e-Shram/EPFO पोर्टल खोलें। 2. सही सेवा और पात्रता चुनें। 3. मोबाइल/ईमेल से पंजीकरण या लॉगिन करें। 4. व्यक्तिगत, शिक्षा/रोजगार और बैंक विवरण भरें। 5. आवश्यक प्रमाण अपलोड करें। 6. आवेदन/प्रोफाइल जमा कर ID सुरक्षित रखें। 7. नौकरी, पंजीकरण या क्लेम की स्थिति पोर्टल पर देखें।"},
identity:{documents:"सेवा के अनुसार पहचान, पता और जन्मतिथि प्रमाण; हाल का फोटो/हस्ताक्षर; मोबाइल/ईमेल; तथा आवेदन प्रकार के अनुसार पुराने कार्ड/लाइसेंस/पासपोर्ट की जानकारी।",eligibility:"आयु, नागरिकता, निवास, पहचान और आवेदन के प्रकार की शर्तें विभाग के अनुसार अलग होती हैं। केवल आधिकारिक पोर्टल की वर्तमान checklist मानें।",steps:"1. संबंधित UIDAI/Passport/ECI/Parivahan/PAN पोर्टल खोलें। 2. नई सेवा, सुधार, नवीनीकरण या स्थिति विकल्प चुनें। 3. आवश्यक पंजीकरण/लॉगिन करें। 4. फॉर्म में विवरण दस्तावेज़ के अनुसार भरें। 5. पोर्टल द्वारा माँगे गए प्रमाण और फोटो अपलोड करें। 6. फीस/अपॉइंटमेंट जहाँ लागू हो पूरा करें। 7. आवेदन संख्या सुरक्षित रखें और स्थिति/अगला चरण देखें।"}
};
const serviceOverrides={
"PM-KISAN":{eligibility:"आम तौर पर पात्र भूमिधर किसान परिवार; कुछ उच्च-आय/पद/पेंशन/आयकर श्रेणियाँ योजना के नियमों के अनुसार अपात्र हो सकती हैं। राज्य द्वारा भूमि रिकॉर्ड सत्यापन आवश्यक है।",documents:"आधार, बैंक खाता/IFSC, मोबाइल और राज्य भूमि रिकॉर्ड/खतौनी। नाम और बैंक विवरण का मिलान आवश्यक हो सकता है।",steps:"1. PM-KISAN की आधिकारिक वेबसाइट पर Farmers Corner खोलें। 2. New Farmer Registration चुनें। 3. ग्रामीण/शहरी और आधार विवरण भरकर सत्यापन करें। 4. भूमि व बैंक विवरण दर्ज करें। 5. आवेदन जमा करें। 6. राज्य सत्यापन, e-KYC और Beneficiary Status विकल्प से प्रगति देखें।"},
"वोटर ID":{eligibility:"भारत का नागरिक, सामान्यतः 18 वर्ष या उससे अधिक आयु का और संबंधित निर्वाचन क्षेत्र का सामान्य निवासी; अंतिम शर्तें निर्वाचन आयोग के नियमों से जाँचें।",documents:"आयु/जन्मतिथि प्रमाण, वर्तमान पते का प्रमाण और हाल का फोटो; फॉर्म के अनुसार अतिरिक्त प्रमाण।",steps:"1. Voters' Service Portal खोलें। 2. नया नाम जोड़ने के लिए Form 6 या सुधार/स्थानांतरण के लिए उपयुक्त सेवा चुनें। 3. विवरण भरें और प्रमाण अपलोड करें। 4. आवेदन जमा कर reference number रखें। 5. आवेदन स्थिति और BLO/ERO सत्यापन देखें।"},
"आय प्रमाणपत्र":{documents:"स्व-घोषणा, निवास प्रमाण और आय का उपलब्ध प्रमाण; नौकरीपेशा होने पर वेतन पर्ची/नियोक्ता प्रमाण जैसे दस्तावेज़ माँगे जा सकते हैं।",eligibility:"उत्तर प्रदेश निवासी; प्रमाणपत्र में दर्शाई जाने वाली पारिवारिक/व्यक्तिगत आय की गणना और स्वीकार्य प्रमाण स्थानीय नियमों/सेवा निर्देशों पर निर्भर हैं।",steps:serviceGuides.cert.steps},
"जाति प्रमाणपत्र":{documents:"पहचान व निवास प्रमाण, स्व-घोषणा और जाति/परिवार/राजस्व रिकॉर्ड से संबंधित उपलब्ध प्रमाण; दस्तावेज़ जाति श्रेणी और स्थानीय नियम पर निर्भर हैं।",eligibility:"आवेदक का संबंधित अधिसूचित जाति/समुदाय से होना और उत्तर प्रदेश की लागू निवास/राजस्व शर्तें पूरी करना आवश्यक है।",steps:serviceGuides.cert.steps},
"निवास प्रमाणपत्र":{documents:"पहचान प्रमाण, वर्तमान निवास का प्रमाण, स्व-घोषणा और पोर्टल द्वारा माँगा गया सहायक रिकॉर्ड।",eligibility:"उत्तर प्रदेश में निवास संबंधी लागू शर्तें पूरी करनी होंगी; स्वीकार्य निवास अवधि/प्रमाण सेवा निर्देशों से जाँचें।",steps:serviceGuides.cert.steps},
"खतौनी / भूलेख":{documents:"जिला, तहसील, ग्राम और खाता/गाटा संख्या या खातेदार का नाम। प्रमाणित प्रति के लिए पोर्टल/तहसील द्वारा माँगी गई अतिरिक्त जानकारी।",eligibility:"रिकॉर्ड खोजने के लिए भूमि का सही स्थान और पहचान विवरण होना चाहिए; प्रमाणित प्रति/संशोधन के लिए अलग अधिकार/प्रक्रिया लागू हो सकती है।",steps:serviceGuides.land.steps},
"पासपोर्ट आवेदन":{documents:"आवेदन श्रेणी के अनुसार वर्तमान पते का प्रमाण, जन्मतिथि प्रमाण और आवश्यकतानुसार Non-ECR/अन्य दस्तावेज़। Appointment पर मूल दस्तावेज़ साथ ले जाएँ।",eligibility:"नागरिकता, आवेदन श्रेणी और पासपोर्ट नियमों के अनुसार पात्रता; Tatkaal के लिए अलग पात्रता/दस्तावेज़ हैं।",steps:"1. Passport Seva पर Register/Login करें। 2. Apply for Fresh Passport/Re-issue चुनें। 3. फॉर्म भरकर submit करें। 4. शुल्क देकर appointment बुक करें। 5. PSK/POPSK में मूल दस्तावेज़ लेकर जाएँ। 6. पुलिस सत्यापन/स्थिति पोर्टल पर देखें।"},
"आधार अपडेट":{documents:"अपडेट के प्रकार के अनुसार UIDAI की स्वीकृत पहचान/पता/जन्मतिथि दस्तावेज़ सूची; बायोमेट्रिक अपडेट के लिए आधार केंद्र जाना पड़ सकता है।",eligibility:"आधार धारक अपने विवरण के लिए UIDAI द्वारा अनुमत अपडेट करा सकता है; ऑनलाइन और केंद्र-आधारित अपडेट के नियम अलग हैं।",steps:"1. UIDAI की आधिकारिक वेबसाइट पर Update Aadhaar विकल्प खोलें। 2. ऑनलाइन उपलब्ध अपडेट और दस्तावेज़ सूची जाँचें। 3. OTP/लॉगिन के बाद विवरण भरें और प्रमाण अपलोड करें। 4. शुल्क जहाँ लागू हो जमा करें। 5. SRN/URN सुरक्षित रखें। बायोमेट्रिक या अन्य सीमित सेवाओं के लिए अधिकृत केंद्र जाएँ।"},
"ई-श्रम कार्ड":{eligibility:"असंगठित क्षेत्र के पात्र श्रमिक; सामान्यतः EPFO/ESIC/NPS (सरकारी वित्तपोषित) सदस्यता और आयकरदाता संबंधी अपात्रता शर्तें लागू होती हैं।",documents:"आधार, आधार से जुड़ा मोबाइल (या CSC में बायोमेट्रिक सहायता), बैंक खाता विवरण और व्यवसाय/काम की जानकारी।",steps:"1. e-Shram पोर्टल पर Register on e-Shram चुनें। 2. मोबाइल OTP/आधार प्रमाणीकरण करें। 3. व्यक्तिगत, पता, व्यवसाय और बैंक विवरण भरें। 4. Preview जाँचकर submit करें। 5. UAN/e-Shram कार्ड डाउनलोड करें।"},
"जन्म प्रमाणपत्र":{documents:"जन्म की तारीख/स्थान, माता-पिता के विवरण और अस्पताल/संस्था की सूचना या स्थानीय Registrar द्वारा माँगा गया प्रमाण। देर से पंजीकरण में अतिरिक्त आदेश/प्रमाण लग सकते हैं।",eligibility:"जन्म घटना का पंजीकरण संबंधित क्षेत्र के Registrar के अधिकार क्षेत्र में होता है; समय बीतने पर अलग प्रक्रिया लागू हो सकती है।",steps:"1. CRS/स्थानीय निकाय पोर्टल पर अपने क्षेत्र की उपलब्ध सेवा जाँचें। 2. जन्म की तारीख, स्थान और माता-पिता का विवरण भरें। 3. अस्पताल/संस्था की सूचना या माँगे गए प्रमाण दें। 4. आवेदन/पंजीकरण संख्या रखें। 5. Registrar की जाँच के बाद प्रमाणपत्र प्राप्त करें।"},
"मृत्यु प्रमाणपत्र":{documents:"मृत्यु की तारीख/स्थान, मृत व्यक्ति का पहचान विवरण और अस्पताल/चिकित्सक/स्थानीय Registrar द्वारा माँगा गया मृत्यु संबंधी प्रमाण।",eligibility:"मृत्यु घटना का पंजीकरण संबंधित क्षेत्र के Registrar द्वारा किया जाता है; देर से पंजीकरण में अतिरिक्त अनुमति/प्रमाण आवश्यक हो सकते हैं।",steps:"1. CRS/स्थानीय निकाय पोर्टल पर उपलब्ध सेवा देखें। 2. मृत व्यक्ति और घटना का विवरण भरें। 3. मृत्यु संबंधी प्रमाण जमा करें। 4. आवेदन/पंजीकरण नंबर रखें। 5. Registrar सत्यापन के बाद प्रमाणपत्र प्राप्त करें."}
};
function getServiceGuide(s){return {...(serviceGuides[s.category]||serviceGuides.identity),...(serviceOverrides[s.name]||{}),sourceNote:"यह सामान्य मार्गदर्शन है। अंतिम दस्तावेज़, पात्रता, शुल्क और समयसीमा संबंधित विभाग के वर्तमान सेवा-पेज पर ही मान्य होंगे। KAGZI आवेदन स्वीकार या स्वीकृत नहीं करता।"};}
const grid=document.getElementById("serviceGrid"),search=document.getElementById("serviceSearch"),region=document.getElementById("regionFilter"),category=document.getElementById("categoryFilter"),count=document.getElementById("resultCount");
const pageView=new URLSearchParams(location.search).get("view")||"all";const schemeCategories=["farmer","welfare","education"];const viewHeading=document.querySelector("#services h2");const viewDescription=document.querySelector("#services .section-head p");if(pageView==="schemes"){if(viewHeading)viewHeading.textContent="सरकारी योजनाएँ";if(viewDescription)viewDescription.textContent="PM-KISAN, पेंशन, छात्रवृत्ति और किसान/कल्याण योजनाएँ";}else if(pageView==="citizen"){if(viewHeading)viewHeading.textContent="नागरिक सेवाएँ";if(viewDescription)viewDescription.textContent="आय, जाति, निवास, राशन कार्ड, प्रमाणपत्र और अन्य नागरिक सेवाएँ";}function render(){const q=search.value.trim().toLocaleLowerCase();const list=services.filter(s=>(pageView==="schemes"?schemeCategories.includes(s.category):pageView==="citizen"?!schemeCategories.includes(s.category):true)&&(region.value==="all"||s.region===region.value)&&(category.value==="all"||s.category===category.value)&&(s.name+" "+s.summary+" "+s.guide).toLocaleLowerCase().includes(q));count.textContent=list.length+" सेवाएँ";grid.replaceChildren();if(!list.length){const p=document.createElement("p");p.textContent="कोई सेवा नहीं मिली। दूसरा शब्द खोजें।";grid.append(p);return;}list.forEach(s=>{const card=document.createElement("article");card.className="service-card";const tags=document.createElement("div");tags.className="service-meta";const regionTag=document.createElement("span");regionTag.className="tag";regionTag.textContent=s.region==="up"?"उत्तर प्रदेश":"केंद्र सरकार";const categoryTag=document.createElement("span");categoryTag.className="tag";categoryTag.textContent=categoryLabels[s.category]||s.category;tags.append(regionTag,categoryTag);const h=document.createElement("h3");h.textContent=s.name;const p=document.createElement("p");p.textContent=s.summary+" "+s.guide;const a=document.createElement("a");a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="आधिकारिक पोर्टल: "+s.portal+" ↗";const direct=document.createElement("a");const directApplications={"आय प्रमाणपत्र":"https://esathi.up.gov.in/citizenservices/login/login.aspx","जाति प्रमाणपत्र":"https://esathi.up.gov.in/citizenservices/login/login.aspx","निवास प्रमाणपत्र":"https://esathi.up.gov.in/citizenservices/login/login.aspx","परिवार रजिस्टर नकल":"https://esathi.up.gov.in/citizenservices/login/login.aspx","हैसियत प्रमाणपत्र":"https://esathi.up.gov.in/citizenservices/login/login.aspx","चरित्र प्रमाणपत्र":"https://esathi.up.gov.in/citizenservices/login/login.aspx","PM-KISAN":"https://www.pmkisan.gov.in/RegistrationFormupdated.aspx","रोजगार पंजीकरण":"https://sewayojan.up.nic.in/IEP/JobseekerRegistration.aspx","UP सेवायोजन पंजीकरण":"https://sewayojan.up.nic.in/IEP/JobseekerRegistration.aspx"};direct.href=directApplications[s.name]||s.url;direct.target="_blank";direct.rel="noopener noreferrer";direct.textContent="आवेदन / सेवा खोलें ↗";direct.className="service-apply-link";const guide=getServiceGuide(s);const details=document.createElement("details");details.className="service-guide";const summary=document.createElement("summary");summary.textContent="दस्तावेज़, पात्रता और आवेदन प्रक्रिया देखें";details.append(summary);[["आवश्यक दस्तावेज़",guide.documents],["कौन आवेदन कर सकता है?",guide.eligibility],["आवेदन कैसे करें?",guide.steps],["महत्वपूर्ण सूचना",guide.sourceNote]].forEach(([label,value])=>{const section=document.createElement("div");section.className="service-guide-section";const heading=document.createElement("strong");heading.textContent=label;const body=document.createElement("p");body.textContent=value;section.append(heading,body);details.append(section);});card.append(tags,h,p,a,direct,details);grid.append(card);});}
[search,region,category].forEach(el=>el.addEventListener(el===search?"input":"change",render));render();

const faqSearch=document.getElementById("faqSearch"),faqList=document.getElementById("faqList"),faqCount=document.getElementById("faqCount");
const commonFaqs=[
["क्या KAGZI सरकारी वेबसाइट है?","नहीं। KAGZI स्वतंत्र सूचना प्लेटफॉर्म है; आवेदन और निर्णय संबंधित सरकारी विभाग करता है।"],
["क्या KAGZI प्रमाणपत्र जारी करता है?","नहीं। KAGZI केवल सामान्य जानकारी और आधिकारिक पोर्टल तक मार्गदर्शन देता है।"],
["क्या आवेदन KAGZI पर जमा होता है?","नहीं। आवेदन संबंधित सरकारी पोर्टल या अधिकृत कार्यालय पर ही करें।"],
["सरकारी सेवा का सही शुल्क कैसे पता करें?","संबंधित विभाग के आधिकारिक पोर्टल पर वर्तमान शुल्क देखें; पुराने लेखों पर निर्भर न रहें।"],
["दस्तावेज़ों की अंतिम सूची कहाँ मिलेगी?","सेवा के आधिकारिक पेज/नोटिस पर सूची जाँचें; राज्य और जिले के अनुसार अंतर हो सकता है।"],
["आवेदन की समयसीमा कैसे पता करें?","आधिकारिक सेवा पेज या विभागीय अधिसूचना देखें।"],
["आवेदन अस्वीकृत हो तो क्या करें?","अस्वीकृति का कारण पढ़ें और संबंधित विभाग की अपील/सुधार प्रक्रिया अपनाएँ।"],
["आवेदन संख्या कहाँ सुरक्षित रखें?","इसे निजी और सुरक्षित रखें; सार्वजनिक चैट में साझा न करें।"],
["क्या OTP साझा करना चाहिए?","नहीं। OTP, पासवर्ड और भुगतान PIN किसी के साथ साझा न करें।"],
["क्या KAGZI आवेदन की गारंटी देता है?","नहीं। पात्रता और स्वीकृति का निर्णय केवल संबंधित विभाग करता है।"],
["आधिकारिक वेबसाइट पहचानने का तरीका क्या है?","विभाग की आधिकारिक वेबसाइट से लिंक खोलें और URL ध्यान से जाँचें।"],
["क्या ऑनलाइन जानकारी बदल सकती है?","हाँ। नियम, शुल्क और तारीखें बदल सकती हैं; आवेदन से पहले पुनः जाँचें।"],
["क्या मोबाइल से सरकारी आवेदन किया जा सकता है?","कई सेवाओं में मोबाइल विकल्प हैं; सेवा की शर्तें आधिकारिक पोर्टल पर देखें।"],
["क्या साइबर कैफे से आवेदन कराना सुरक्षित है?","विश्वसनीय केंद्र चुनें, स्क्रीन पर विवरण जाँचें और OTP/पासवर्ड स्वयं दर्ज करें।"],
["क्या KAGZI को आधार नंबर भेजना चाहिए?","नहीं। AI चैट में पूरा आधार या अन्य संवेदनशील पहचान विवरण न भेजें।"],
["आय प्रमाणपत्र की जानकारी कहाँ मिलेगी?","उत्तर प्रदेश में UP e-District पोर्टल से सेवा की वर्तमान जानकारी देखें।"],
["जाति प्रमाणपत्र की जानकारी कहाँ मिलेगी?","UP e-District पर श्रेणी, पात्रता और जिले की प्रक्रिया की पुष्टि करें।"],
["निवास प्रमाणपत्र के नियम कहाँ देखें?","UP e-District और संबंधित जिला प्रशासन के निर्देश देखें।"],
["राशन कार्ड में सुधार कैसे समझें?","UP Food & Civil Supplies पोर्टल पर सदस्य/विवरण संशोधन सेवा देखें।"],
["पेंशन की पात्रता कैसे जाँचें?","योजना के आधिकारिक पोर्टल पर आयु, आय और अन्य शर्तें जाँचें।"],
["छात्रवृत्ति की तारीख कहाँ मिलेगी?","संबंधित छात्रवृत्ति पोर्टल पर चालू शैक्षणिक वर्ष की सूचना देखें।"],
["PM-KISAN स्थिति कहाँ देखें?","PM-KISAN के आधिकारिक पोर्टल पर beneficiary status विकल्प देखें।"],
["खतौनी कैसे खोजें?","UP Bhulekh पर भूमि रिकॉर्ड खोजें; प्रमाणित प्रति के नियम अलग हो सकते हैं।"],
["वोटर सूची में नाम कैसे खोजें?","निर्वाचन आयोग के आधिकारिक Voters' Service Portal का उपयोग करें।"],
["ड्राइविंग लाइसेंस की स्थिति कहाँ देखें?","Parivahan पोर्टल पर राज्य चुनकर आवेदन स्थिति देखें।"],
["पासपोर्ट आवेदन कहाँ करें?","Passport Seva के आधिकारिक पोर्टल से आवेदन और अपॉइंटमेंट जानकारी लें।"],
["PAN कार्ड सेवाएँ कहाँ मिलेंगी?","Income Tax e-Filing या अधिकृत PAN सेवा प्रदाता की आधिकारिक जानकारी देखें।"],
["जन्म पंजीकरण कहाँ होगा?","स्थानीय Registrar और Civil Registration System की लागू प्रक्रिया जाँचें।"],
["रोजगार पंजीकरण कहाँ करें?","National Career Service या UP Sewayojan के आधिकारिक पोर्टल देखें।"],
["बिजली बिल की जानकारी कहाँ मिलेगी?","अपने क्षेत्र के बिजली वितरण निगम की आधिकारिक वेबसाइट पर जाएँ।"],
["आवेदन में गलती हो गई तो?","पोर्टल पर correction विकल्प या संबंधित कार्यालय की प्रक्रिया जाँचें।"],
["क्या सभी सेवाएँ हर जिले में उपलब्ध हैं?","नहीं। कुछ सेवाएँ जिले, स्थानीय निकाय या विभाग के अनुसार बदलती हैं।"],
["दस्तावेज़ अपलोड करने से पहले क्या जाँचें?","फाइल का प्रकार, आकार और पोर्टल के निर्देश पढ़ें; केवल आधिकारिक पोर्टल पर अपलोड करें।"],
["AI का जवाब अंतिम सरकारी आदेश है?","नहीं। AI जवाब सामान्य मार्गदर्शन है; अंतिम जानकारी विभाग से लें।"],
["शिकायत कहाँ करें?","संबंधित विभाग के आधिकारिक grievance/जनसुनवाई माध्यम का उपयोग करें।"]
];
const serviceFaqs=services.map(s=>({q:s.name+" के लिए जानकारी कहाँ मिलेगी?",a:s.summary+" "+s.guide+" आधिकारिक पोर्टल: "+s.portal+" ("+s.url+")"}));
const faqs=[...serviceFaqs,...commonFaqs.map(([q,a])=>({q,a}))].slice(0,100);
function renderFaq(){const q=faqSearch.value.trim().toLocaleLowerCase();const filtered=faqs.filter(f=>(f.q+" "+f.a).toLocaleLowerCase().includes(q));faqCount.textContent=filtered.length+" सवाल";faqList.replaceChildren();if(!filtered.length){const p=document.createElement("p");p.textContent="कोई सवाल नहीं मिला। दूसरा शब्द खोजें।";faqList.append(p);return;}filtered.forEach((f,i)=>{const details=document.createElement("details");details.className="faq-item";const summary=document.createElement("summary");summary.textContent=f.q;const answer=document.createElement("p");answer.textContent=f.a;details.append(summary,answer);faqList.append(details);});}
faqSearch.addEventListener("input",renderFaq);renderFaq();

const form=document.getElementById("chatForm"),input=document.getElementById("chatInput"),messages=document.getElementById("chatMessages"),send=document.getElementById("sendButton"),status=document.getElementById("chatStatus"),history=[];
let lastAssistantReply="";
const voiceInputButton=document.getElementById("voiceInputButton"),readAnswerButton=document.getElementById("readAnswerButton"),voiceStatus=document.getElementById("voiceStatus"),voiceLanguage=document.getElementById("voiceLanguage"),autoSpeak=document.getElementById("autoSpeak");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null,isListening=false;
function speakText(text){if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){voiceStatus.textContent="इस ब्राउज़र में आवाज़ चलाने की सुविधा उपलब्ध नहीं है। Chrome में खोलें।";return;}const cleanText=String(text||"").replace(/\\s+/g," ").trim();if(!cleanText){voiceStatus.textContent="सुनाने के लिए जवाब उपलब्ध नहीं है।";return;}const synth=window.speechSynthesis;synth.cancel();synth.resume();const lang=voiceLanguage.value||"hi-IN";const chunks=[];let remaining=cleanText;while(remaining.length>0){if(remaining.length<=180){chunks.push(remaining);break;}let cut=remaining.lastIndexOf(" ",180);if(cut<80)cut=180;chunks.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim();}let index=0;const playNext=()=>{if(index>=chunks.length){voiceStatus.textContent="आवाज़ पूरी हुई।";return;}const utterance=new SpeechSynthesisUtterance(chunks[index++]);utterance.lang=lang;utterance.rate=0.9;utterance.onstart=()=>{voiceStatus.textContent="🔊 जवाब सुनाया जा रहा है…";};utterance.onend=()=>{playNext();};utterance.onerror=event=>{voiceStatus.textContent="मोबाइल का Text-to-Speech इंजन आवाज़ नहीं चला पाया ("+(event.error||"unknown")+"). फोन में Text-to-speech output का इंजन और Hindi voice data जाँचें।";};try{synth.speak(utterance);}catch(error){voiceStatus.textContent="आवाज़ शुरू नहीं हो सकी। फोन की Text-to-speech सेटिंग जाँचें।";}};try{playNext();}catch(error){voiceStatus.textContent="आवाज़ शुरू नहीं हो सकी। फोन की Text-to-speech सेटिंग जाँचें।";}}
function bubble(text,kind){const el=document.createElement("div");el.className="bubble "+kind;const content=document.createElement("span");content.textContent=text;el.append(content);if(kind==="bot"){const speak=document.createElement("button");speak.type="button";speak.className="bubble-speak";speak.textContent="🔊 सुनें";speak.addEventListener("click",()=>speakText(text));el.append(speak);lastAssistantReply=text;readAnswerButton.disabled=false;if(autoSpeak.checked)speakText(text);}messages.append(el);messages.scrollTop=messages.scrollHeight;}
if(SpeechRecognition){recognition=new SpeechRecognition();recognition.lang=voiceLanguage.value;recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{isListening=true;voiceInputButton.textContent="⏹ सुनना बंद करें";voiceStatus.textContent="बोलिए… आपकी आवाज़ को टेक्स्ट में बदला जा रहा है।";};recognition.onresult=event=>{const transcript=event.results?.[0]?.[0]?.transcript||"";input.value=(input.value?input.value+" ":"")+transcript;input.focus();voiceStatus.textContent="आवाज़ टेक्स्ट में आ गई है। भेजने से पहले जाँच लें।";};recognition.onerror=event=>{voiceStatus.textContent=event.error==="not-allowed"?"माइक की अनुमति दें, फिर दोबारा कोशिश करें.":"आवाज़ पहचान उपलब्ध नहीं हुई। आप सवाल टाइप कर सकते हैं।";};recognition.onend=()=>{isListening=false;voiceInputButton.textContent="🎙 बोलकर लिखें";};voiceInputButton.addEventListener("click",()=>{if(isListening){recognition.stop();return;}recognition.lang=voiceLanguage.value;try{recognition.start();}catch(error){voiceStatus.textContent="माइक शुरू नहीं हुआ। थोड़ी देर बाद फिर कोशिश करें।";}});}else{voiceInputButton.disabled=true;voiceInputButton.title="इस ब्राउज़र में Speech Recognition उपलब्ध नहीं है";voiceStatus.textContent="इस ब्राउज़र में आवाज़ से लिखने की सुविधा नहीं है। Chrome के नए संस्करण में कोशिश करें।";}
readAnswerButton.addEventListener("click",()=>{if(lastAssistantReply)speakText(lastAssistantReply);});
voiceLanguage.addEventListener("change",()=>{if(recognition)recognition.lang=voiceLanguage.value;});

form.addEventListener("submit",async e=>{e.preventDefault();const question=input.value.trim();if(!question||send.disabled)return;bubble(question,"user");history.push({role:"user",content:question});input.value="";send.disabled=true;send.textContent="…";status.textContent="जवाब तैयार हो रहा है…";try{const response=await fetch("/api/jan-seva-assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,history:history.slice(0,-1)})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"AI अभी उपलब्ध नहीं है। ऊपर की डायरेक्टरी और आधिकारिक लिंक इस्तेमाल करें।");bubble(String(data.reply||"अभी जवाब उपलब्ध नहीं है।"),"bot");history.push({role:"assistant",content:String(data.reply||"")});if(history.length>8)history.splice(0,history.length-8);status.textContent="उत्तर सामान्य जानकारी है। अंतिम नियम संबंधित सरकारी पोर्टल पर जाँचें।";}catch(err){bubble(err.message||"AI सेवा अभी उपलब्ध नहीं है।","bot");status.textContent="AI quota/configuration उपलब्ध न होने पर सेवा डायरेक्टरी काम करती रहेगी।";}finally{send.disabled=false;send.textContent="भेजें";input.focus();}});

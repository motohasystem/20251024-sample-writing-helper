// グローバル変数
let currentStep = 0;
const totalSteps = 7;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializePrefectures();
    initializeNavigation();
    initializeActions();
    initializeFormListeners();
    updateStepDisplay();
    updateLivePreview();
});

// 都道府県セレクトボックスの初期化
function initializePrefectures() {
    const prefectureSelect = document.getElementById('prefecture');
    const municipalitySelect = document.getElementById('municipality');

    // 都道府県の選択肢を追加
    Object.keys(prefecturesData).forEach(prefecture => {
        const option = document.createElement('option');
        option.value = prefecture;
        option.textContent = prefecture;
        prefectureSelect.appendChild(option);
    });

    // 都道府県が選択されたら市区町村を更新
    prefectureSelect.addEventListener('change', function() {
        const selectedPrefecture = this.value;
        municipalitySelect.innerHTML = '';
        municipalitySelect.disabled = true;

        if (selectedPrefecture) {
            const municipalities = prefecturesData[selectedPrefecture];
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '選択してください';
            municipalitySelect.appendChild(defaultOption);

            municipalities.forEach(municipality => {
                const option = document.createElement('option');
                option.value = municipality;
                option.textContent = municipality;
                municipalitySelect.appendChild(option);
            });

            municipalitySelect.disabled = false;
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'まず都道府県を選択してください';
            municipalitySelect.appendChild(defaultOption);
        }

        updateLivePreview();
    });

    municipalitySelect.addEventListener('change', updateLivePreview);
}

// ナビゲーションの初期化
function initializeNavigation() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFinish = document.getElementById('btn-finish');

    btnPrev.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateStepDisplay();
        }
    });

    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                updateStepDisplay();
            }
        }
    });

    btnFinish.addEventListener('click', () => {
        alert('募集文章の作成が完了しました！\nMarkdownをダウンロードするか、コピーしてご利用ください。');
    });
}

// アクションボタンの初期化
function initializeActions() {
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnCopyMd = document.getElementById('btn-copy-md');
    const fileInput = document.getElementById('file-input');

    btnSave.addEventListener('click', saveToJSON);
    btnLoad.addEventListener('click', () => fileInput.click());
    btnExportMd.addEventListener('click', exportMarkdown);
    btnCopyMd.addEventListener('click', copyMarkdown);

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadFromJSON(file);
        }
    });
}

// フォームの入力リスナーを初期化
function initializeFormListeners() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updateLivePreview);
        input.addEventListener('change', updateLivePreview);
    });
}

// ステップ表示を更新
function updateStepDisplay() {
    // フォームセクションの表示切替
    document.querySelectorAll('.form-section').forEach((section, index) => {
        section.classList.toggle('active', index === currentStep);
    });

    // ステップインジケーターの更新
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index === currentStep);
        step.classList.toggle('completed', index < currentStep);
    });

    // ナビゲーションボタンの表示制御
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFinish = document.getElementById('btn-finish');

    btnPrev.disabled = currentStep === 0;

    if (currentStep === totalSteps - 1) {
        btnNext.style.display = 'none';
        btnFinish.style.display = 'block';
    } else {
        btnNext.style.display = 'block';
        btnFinish.style.display = 'none';
    }

    // プレビューセクションでMarkdownを更新
    if (currentStep === totalSteps - 1) {
        updateMarkdownPreview();
    }

    // ライブプレビューを更新
    updateLivePreview();
}

// 現在のステップのバリデーション
function validateCurrentStep() {
    const currentSection = document.querySelector(`.form-section[data-section="${currentStep}"]`);
    const requiredFields = currentSection.querySelectorAll('[required]');

    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.style.borderColor = '#ddd';
        }
    });

    if (!isValid) {
        alert('必須項目をすべて入力してください。');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
    }

    return isValid;
}

// フォームデータを収集
function getFormData() {
    return {
        prefecture: document.getElementById('prefecture').value,
        municipality: document.getElementById('municipality').value,
        regionName: document.getElementById('region-name').value,
        regionFeatures: document.getElementById('region-features').value,
        regionChallenges: document.getElementById('region-challenges').value,
        recruitmentNumber: document.getElementById('recruitment-number').value,
        recruitmentBackground: document.getElementById('recruitment-background').value,
        mission: document.getElementById('mission').value,
        activitySupport: document.getElementById('activity-support').value,
        ageRequirement: document.getElementById('age-requirement').value,
        residenceRequirement: document.getElementById('residence-requirement').value,
        requiredSkills: document.getElementById('required-skills').value,
        preferredSkills: document.getElementById('preferred-skills').value,
        desiredPersonality: document.getElementById('desired-personality').value,
        employmentStatus: document.getElementById('employment-status').value,
        salary: document.getElementById('salary').value,
        contractPeriod: document.getElementById('contract-period').value,
        workingHours: document.getElementById('working-hours').value,
        holidays: document.getElementById('holidays').value,
        insurance: document.getElementById('insurance').value,
        housing: document.getElementById('housing').value,
        vehicle: document.getElementById('vehicle').value,
        otherBenefits: document.getElementById('other-benefits').value,
        applicationDeadline: document.getElementById('application-deadline').value,
        applicationMethod: document.getElementById('application-method').value,
        requiredDocuments: document.getElementById('required-documents').value,
        selectionProcess: document.getElementById('selection-process').value,
        contactDepartment: document.getElementById('contact-department').value,
        contactPerson: document.getElementById('contact-person').value,
        contactPhone: document.getElementById('contact-phone').value,
        contactEmail: document.getElementById('contact-email').value,
        additionalNotes: document.getElementById('additional-notes').value
    };
}

// フォームデータを設定
function setFormData(data) {
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (element) {
            element.value = data[key] || '';

            // 都道府県が変更された場合、市区町村の選択肢を更新
            if (key === 'prefecture') {
                const event = new Event('change');
                element.dispatchEvent(event);
            }
        }
    });

    // 市区町村の値を設定（都道府県の更新後に実行）
    setTimeout(() => {
        const municipalityElement = document.getElementById('municipality');
        if (municipalityElement && data.municipality) {
            municipalityElement.value = data.municipality;
        }
        updateLivePreview();
    }, 100);
}

// Markdownを生成
function generateMarkdown() {
    const data = getFormData();

    let markdown = `# ${data.municipality || '○○市'}地域おこし協力隊 募集\n\n`;

    // 地域情報
    if (data.regionFeatures || data.regionChallenges) {
        markdown += `## 地域について\n\n`;

        if (data.regionName) {
            markdown += `### ${data.regionName}\n\n`;
        }

        if (data.regionFeatures) {
            markdown += `${data.regionFeatures}\n\n`;
        }

        if (data.regionChallenges) {
            markdown += `**地域の課題**\n\n${data.regionChallenges}\n\n`;
        }
    }

    // 募集詳細
    markdown += `## 募集内容\n\n`;

    if (data.recruitmentNumber) {
        markdown += `**募集人数:** ${data.recruitmentNumber}名\n\n`;
    }

    if (data.recruitmentBackground) {
        markdown += `**募集背景**\n\n${data.recruitmentBackground}\n\n`;
    }

    if (data.mission) {
        markdown += `**活動内容・ミッション**\n\n${data.mission}\n\n`;
    }

    if (data.activitySupport) {
        markdown += `**活動サポート体制**\n\n${data.activitySupport}\n\n`;
    }

    // 応募条件
    markdown += `## 応募条件\n\n`;

    if (data.ageRequirement) {
        markdown += `**年齢:** ${data.ageRequirement}\n\n`;
    }

    if (data.residenceRequirement) {
        markdown += `**居住要件**\n\n${data.residenceRequirement}\n\n`;
    }

    if (data.requiredSkills) {
        markdown += `**必須スキル・経験**\n\n${data.requiredSkills}\n\n`;
    }

    if (data.preferredSkills) {
        markdown += `**歓迎するスキル・経験**\n\n${data.preferredSkills}\n\n`;
    }

    if (data.desiredPersonality) {
        markdown += `**求める人物像**\n\n${data.desiredPersonality}\n\n`;
    }

    // 待遇・条件
    markdown += `## 待遇・勤務条件\n\n`;

    if (data.employmentStatus) {
        markdown += `**雇用形態:** ${data.employmentStatus}\n\n`;
    }

    if (data.salary) {
        markdown += `**報酬:** ${data.salary}\n\n`;
    }

    if (data.contractPeriod) {
        markdown += `**任期:** ${data.contractPeriod}\n\n`;
    }

    if (data.workingHours) {
        markdown += `**勤務時間:** ${data.workingHours}\n\n`;
    }

    if (data.holidays) {
        markdown += `**休日:** ${data.holidays}\n\n`;
    }

    if (data.insurance) {
        markdown += `**社会保険:** ${data.insurance}\n\n`;
    }

    if (data.housing) {
        markdown += `**住居**\n\n${data.housing}\n\n`;
    }

    if (data.vehicle) {
        markdown += `**車両:** ${data.vehicle}\n\n`;
    }

    if (data.otherBenefits) {
        markdown += `**その他待遇**\n\n${data.otherBenefits}\n\n`;
    }

    // 応募情報
    markdown += `## 応募について\n\n`;

    if (data.applicationDeadline) {
        const deadline = new Date(data.applicationDeadline);
        const formattedDate = `${deadline.getFullYear()}年${deadline.getMonth() + 1}月${deadline.getDate()}日`;
        markdown += `**応募締切:** ${formattedDate}\n\n`;
    }

    if (data.applicationMethod) {
        markdown += `**応募方法**\n\n${data.applicationMethod}\n\n`;
    }

    if (data.requiredDocuments) {
        markdown += `**必要書類**\n\n${data.requiredDocuments}\n\n`;
    }

    if (data.selectionProcess) {
        markdown += `**選考プロセス**\n\n${data.selectionProcess}\n\n`;
    }

    if (data.additionalNotes) {
        markdown += `**注意事項**\n\n${data.additionalNotes}\n\n`;
    }

    // 問い合わせ先
    markdown += `## 問い合わせ先\n\n`;

    if (data.contactDepartment) {
        markdown += `${data.contactDepartment}\n\n`;
    }

    if (data.contactPerson) {
        markdown += `担当: ${data.contactPerson}\n\n`;
    }

    if (data.contactPhone) {
        markdown += `電話: ${data.contactPhone}\n\n`;
    }

    if (data.contactEmail) {
        markdown += `メール: ${data.contactEmail}\n\n`;
    }

    return markdown;
}

// MarkdownをHTMLに変換（シンプル版）
function markdownToHTML(markdown) {
    let html = markdown;

    // 見出し
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 太字
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 斜体
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 改行を段落に
    html = html.split('\n\n').map(para => {
        if (!para.trim().startsWith('<h') && para.trim()) {
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }
        return para;
    }).join('\n');

    return html;
}

// ライブプレビューを更新
function updateLivePreview() {
    const markdown = generateMarkdown();
    const html = markdownToHTML(markdown);
    document.getElementById('live-preview-content').innerHTML = html;
}

// Markdownプレビューを更新（プレビューセクション用）
function updateMarkdownPreview() {
    const markdown = generateMarkdown();
    const html = markdownToHTML(markdown);
    document.getElementById('markdown-preview').innerHTML = html;
}

// JSONとして保存
function saveToJSON() {
    const data = getFormData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `chiikiokoshi_${data.municipality || 'draft'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('データをJSONファイルとして保存しました。');
}

// JSONから読み込み
function loadFromJSON(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            setFormData(data);
            alert('データを読み込みました。');
        } catch (error) {
            alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
        }
    };

    reader.readAsText(file);
}

// Markdownをエクスポート
function exportMarkdown() {
    const markdown = generateMarkdown();
    const data = getFormData();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `chiikiokoshi_${data.municipality || 'draft'}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Markdownファイルをダウンロードしました。');
}

// Markdownをコピー
function copyMarkdown() {
    const markdown = generateMarkdown();

    navigator.clipboard.writeText(markdown).then(() => {
        alert('Markdownをクリップボードにコピーしました。');
    }).catch(err => {
        // フォールバック方法
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Markdownをクリップボードにコピーしました。');
    });
}

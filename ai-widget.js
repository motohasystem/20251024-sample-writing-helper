/**
 * AIウィジェット - テキストエリア入力サポート
 */
const AIWidget = (function() {
    'use strict';

    // ウィジェットのインスタンスを保持
    const instances = new Map();

    /**
     * ウィジェットクラス
     */
    class Widget {
        constructor(textareaId, questionsJsonPath) {
            this.textareaId = textareaId;
            this.questionsJsonPath = questionsJsonPath;
            this.textarea = document.getElementById(textareaId);
            this.questions = null;
            this.currentQuestionIndex = 0;
            this.answers = {};
            
            if (!this.textarea) {
                console.error(`Textarea with id "${textareaId}" not found`);
                return;
            }

            this.init();
        }

        /**
         * 初期化
         */
        async init() {
            // マジックボタンを追加
            this.addMagicButton();
            
            // 質問データを読み込み
            await this.loadQuestions();
        }

        /**
         * マジックボタンを追加
         */
        addMagicButton() {
            const formGroup = this.textarea.closest('.form-group');
            if (!formGroup) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ai-widget-btn';
            button.textContent = 'AI入力サポート';
            button.onclick = () => this.openModal();

            formGroup.style.position = 'relative';
            formGroup.appendChild(button);
        }

        /**
         * 質問データを読み込み
         */
        async loadQuestions() {
            try {
                const response = await fetch(this.questionsJsonPath);
                if (!response.ok) {
                    throw new Error(`Failed to load questions: ${response.status}`);
                }
                this.questions = await response.json();
            } catch (error) {
                console.error('Error loading questions:', error);
                alert('質問データの読み込みに失敗しました');
            }
        }

        /**
         * モーダルを開く
         */
        openModal() {
            if (!this.questions) {
                alert('質問データが読み込まれていません');
                return;
            }

            // 保存された回答を復元
            this.loadSavedAnswers();

            // モーダル要素を作成
            this.createModal();
            
            // 最初の質問（または前回の続き）を表示
            this.renderQuestion();
        }

        /**
         * モーダル要素を作成
         */
        createModal() {
            // 既存のモーダルを削除
            const existingModal = document.getElementById('ai-modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }

            const overlay = document.createElement('div');
            overlay.id = 'ai-modal-overlay';
            overlay.className = 'ai-modal-overlay';
            
            overlay.innerHTML = `
                <div class="ai-modal">
                    <div class="ai-modal-header">
                        <div class="ai-modal-title">${this.questions.title || 'AI入力サポート'}</div>
                        <button class="ai-modal-close" onclick="AIWidget.closeModal('${this.textareaId}')">×</button>
                    </div>
                    <div class="ai-modal-body">
                        <div class="progress-bar">
                            <div class="progress-text">質問 <span id="current-question-num">1</span>/${this.questions.questions.length}</div>
                            <div class="progress-track">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                        </div>
                        <div id="answered-questions-container"></div>
                        <div id="question-container"></div>
                    </div>
                    <div class="ai-modal-footer">
                        <button class="btn btn-secondary" id="btn-back" onclick="AIWidget.previousQuestion('${this.textareaId}')">
                            ← 戻る
                        </button>
                        <button class="btn btn-primary" id="btn-next" onclick="AIWidget.nextQuestion('${this.textareaId}')">
                            次へ →
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // オーバーレイクリックで閉じる
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });

            // ESCキーで閉じる
            this.escKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal();
                }
            };
            document.addEventListener('keydown', this.escKeyHandler);
        }

        /**
         * 質問を表示
         */
        renderQuestion() {
            const question = this.questions.questions[this.currentQuestionIndex];
            const container = document.getElementById('question-container');
            
            // 現在の質問番号を更新
            document.getElementById('current-question-num').textContent = this.currentQuestionIndex + 1;
            
            // 進捗バーを更新
            const progress = ((this.currentQuestionIndex + 1) / this.questions.questions.length) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';

            // 回答済み質問を表示
            this.renderAnsweredQuestions();

            // 質問HTMLを生成
            container.innerHTML = `
                <div class="question-container">
                    <div class="question-text">
                        ${question.text}
                        ${question.required ? '<span class="question-required">*</span>' : ''}
                    </div>
                    ${question.placeholder ? `<div class="question-placeholder">${question.placeholder}</div>` : ''}
                    <input 
                        type="text" 
                        class="answer-input" 
                        id="current-answer-input"
                        value="${this.answers[question.id] || ''}"
                        placeholder="回答を入力..."
                    />
                </div>
            `;

            // 入力欄にフォーカス
            const input = document.getElementById('current-answer-input');
            setTimeout(() => input.focus(), 100);

            // Enterキーで次へ
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.nextQuestion();
                }
            });

            // ボタンの状態を更新
            this.updateButtons();
        }

        /**
         * 回答済み質問を表示
         */
        renderAnsweredQuestions() {
            const container = document.getElementById('answered-questions-container');
            const answeredQuestions = this.questions.questions.slice(0, this.currentQuestionIndex);
            
            if (answeredQuestions.length === 0) {
                container.innerHTML = '';
                return;
            }

            const answeredHtml = answeredQuestions.map((q, index) => {
                const answer = this.answers[q.id] || '未回答';
                return `
                    <div class="answered-question">
                        <span class="answered-check">✓</span>
                        <span class="answered-text">
                            ${q.text}
                            <span class="answered-value">→ ${answer}</span>
                        </span>
                        <button class="answered-edit" onclick="AIWidget.editQuestion('${this.textareaId}', ${index})">
                            編集
                        </button>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="answered-questions">
                    ${answeredHtml}
                </div>
            `;
        }

        /**
         * 次の質問へ
         */
        nextQuestion() {
            const input = document.getElementById('current-answer-input');
            const currentQuestion = this.questions.questions[this.currentQuestionIndex];
            const answer = input.value.trim();

            // 必須チェック
            if (currentQuestion.required && !answer) {
                alert('この質問への回答は必須です');
                input.focus();
                return;
            }

            // 回答を保存
            this.answers[currentQuestion.id] = answer;
            this.saveAnswers();

            // 次の質問へ
            if (this.currentQuestionIndex < this.questions.questions.length - 1) {
                this.currentQuestionIndex++;
                this.renderQuestion();
            } else {
                // 全ての質問に回答済み
                this.showCompletion();
            }
        }

        /**
         * 前の質問へ
         */
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                // 現在の入力を保存
                const input = document.getElementById('current-answer-input');
                const currentQuestion = this.questions.questions[this.currentQuestionIndex];
                this.answers[currentQuestion.id] = input.value.trim();
                this.saveAnswers();

                this.currentQuestionIndex--;
                this.renderQuestion();
            }
        }

        /**
         * 特定の質問を編集
         */
        editQuestion(index) {
            // 現在の入力を保存
            const input = document.getElementById('current-answer-input');
            if (input) {
                const currentQuestion = this.questions.questions[this.currentQuestionIndex];
                this.answers[currentQuestion.id] = input.value.trim();
                this.saveAnswers();
            }

            this.currentQuestionIndex = index;
            this.renderQuestion();
        }

        /**
         * ボタンの状態を更新
         */
        updateButtons() {
            const btnBack = document.getElementById('btn-back');
            const btnNext = document.getElementById('btn-next');

            // 戻るボタン
            btnBack.disabled = this.currentQuestionIndex === 0;

            // 次へボタン
            const isLastQuestion = this.currentQuestionIndex === this.questions.questions.length - 1;
            btnNext.textContent = isLastQuestion ? '完了' : '次へ →';
        }

        /**
         * 全質問完了時の表示
         */
        showCompletion() {
            const container = document.getElementById('question-container');
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
                    <div style="font-size: 18px; font-weight: 600; color: #27ae60; margin-bottom: 8px;">
                        全ての質問に回答しました
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        「生成する」ボタンをクリックして文章を作成します
                    </div>
                </div>
            `;

            // ボタンを変更
            const footer = document.querySelector('.ai-modal-footer');
            footer.innerHTML = `
                <button class="btn btn-secondary" onclick="AIWidget.editQuestion('${this.textareaId}', 0)">
                    最初から編集
                </button>
                <button class="btn btn-primary" onclick="AIWidget.generateText('${this.textareaId}')">
                    生成する
                </button>
            `;
        }

        /**
         * テキスト生成（現時点ではダミー実装）
         */
        generateText() {
            // 回答を整形
            let generatedText = '【生成されたテキスト】\n\n';
            this.questions.questions.forEach(q => {
                const answer = this.answers[q.id];
                if (answer) {
                    generatedText += `${q.text}: ${answer}\n`;
                }
            });
            generatedText += '\n※実際のAI生成機能は次のフェーズで実装されます';

            // テキストエリアに挿入
            this.textarea.value = generatedText;

            // 保存データをクリア
            this.clearSavedAnswers();

            // モーダルを閉じる
            this.closeModal();

            // 成功メッセージ
            alert('テキストが生成されました');
        }

        /**
         * モーダルを閉じる
         */
        closeModal() {
            const overlay = document.getElementById('ai-modal-overlay');
            if (overlay) {
                overlay.remove();
            }

            // ESCキーハンドラを削除
            if (this.escKeyHandler) {
                document.removeEventListener('keydown', this.escKeyHandler);
            }
        }

        /**
         * 回答をLocalStorageに保存
         */
        saveAnswers() {
            const data = {
                answers: this.answers,
                currentQuestionIndex: this.currentQuestionIndex,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(`ai-widget-${this.textareaId}`, JSON.stringify(data));
        }

        /**
         * 保存された回答を読み込み
         */
        loadSavedAnswers() {
            const saved = localStorage.getItem(`ai-widget-${this.textareaId}`);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.answers = data.answers || {};
                    this.currentQuestionIndex = data.currentQuestionIndex || 0;
                } catch (e) {
                    console.error('Failed to load saved answers:', e);
                }
            }
        }

        /**
         * 保存された回答をクリア
         */
        clearSavedAnswers() {
            localStorage.removeItem(`ai-widget-${this.textareaId}`);
            this.answers = {};
            this.currentQuestionIndex = 0;
        }
    }

    // 公開API
    return {
        /**
         * ウィジェットを初期化
         */
        init: function(textareaId, questionsJsonPath) {
            const widget = new Widget(textareaId, questionsJsonPath);
            instances.set(textareaId, widget);
            return widget;
        },

        /**
         * ウィジェットインスタンスを取得
         */
        getInstance: function(textareaId) {
            return instances.get(textareaId);
        },

        /**
         * モーダルを閉じる（グローバルハンドラ用）
         */
        closeModal: function(textareaId) {
            const widget = instances.get(textareaId);
            if (widget) {
                widget.closeModal();
            }
        },

        /**
         * 次の質問へ（グローバルハンドラ用）
         */
        nextQuestion: function(textareaId) {
            const widget = instances.get(textareaId);
            if (widget) {
                widget.nextQuestion();
            }
        },

        /**
         * 前の質問へ（グローバルハンドラ用）
         */
        previousQuestion: function(textareaId) {
            const widget = instances.get(textareaId);
            if (widget) {
                widget.previousQuestion();
            }
        },

        /**
         * 質問を編集（グローバルハンドラ用）
         */
        editQuestion: function(textareaId, index) {
            const widget = instances.get(textareaId);
            if (widget) {
                widget.editQuestion(index);
            }
        },

        /**
         * テキスト生成（グローバルハンドラ用）
         */
        generateText: function(textareaId) {
            const widget = instances.get(textareaId);
            if (widget) {
                widget.generateText();
            }
        }
    };
})();

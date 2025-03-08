import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { TranslatorService } from './services/translator.service';
import { FileUploadDetails } from './models/file-upload-details.model';
import { TranslateDto } from './models/translateDto.model';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
    styleUrl: './app.component.scss'
})
export class AppComponent {
    originalText: string = '';
    translatedText: string = '';
    targetLanguage: string = '';
    selectedFile: File | null = null;
    languages: any[] = [];
    isTranslationInProgress: boolean = false;
    isTextExtractingInProgress: boolean = false;
    fileName: string = '';

    private translateService = inject(TranslatorService);

    ngOnInit() {
        this.translateService.getLanguages().subscribe({
            next: (data: any) => this.languages = data.languages
        });
    }

    onFileSelected(event: any) {
        this.isTextExtractingInProgress = true;
        this.translatedText = '';
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.selectedFile = file;
            this.fileName = this.selectedFile ? this.selectedFile.name : '';
            const formData = new FormData();
            formData.append('file', file, file.name)
            this.translateService.extractTextFromFile(formData, this.fileName).subscribe({
                next: (data: FileUploadDetails) => {
                    this.originalText = data.text;
                    this.isTextExtractingInProgress = false;
                }
            })

        } else {
            alert('Please select a valid PDF file');
            this.isTextExtractingInProgress = false;        }
    }

    translate() {
        this.translatedText = '';
        let translateDto = new TranslateDto({});
        translateDto.language = this.targetLanguage;
        translateDto.text = this.originalText.replace(/(\r\n|\n|\r)/gm, "");;
        this.isTranslationInProgress = true;
        this.translateService.translateText(translateDto).subscribe({
            next: (data: any) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response, 'text/html');
                this.translatedText = doc.body.innerHTML;
            },
            complete: () => this.isTranslationInProgress = false
        })
    }

    downloadPdf() {
        this.translateService.downloadTranslatedPdf(this.translatedText).subscribe({
            next: (data: any) => {
                const a = document.createElement('a');
                const objectUrl = URL.createObjectURL(data);
                a.href = objectUrl;
                a.download = this.fileName.replace('.pdf', '_') + this.targetLanguage + '_translated'+ '.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            }
        });
    }
}
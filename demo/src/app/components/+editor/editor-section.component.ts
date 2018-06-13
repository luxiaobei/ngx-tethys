import { Component, TemplateRef, OnInit } from '@angular/core';
@Component({
    selector: 'demo-editor',
    templateUrl: './editor-section.component.html'
})
export class DemoEditorSectionComponent implements OnInit {

    public value = '**editor**';

    public config = { type: 'simple' };

    constructor(
    ) {
    }

    ngOnInit() {

    }
}
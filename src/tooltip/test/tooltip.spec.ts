import { NgModule, Component, DebugElement, ViewChild } from '@angular/core';
import { ThyTooltipModule } from '../tooltip.module';
import { ComponentFixture, fakeAsync, TestBed, inject, tick, flushMicrotasks, async } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FocusMonitor } from '@angular/cdk/a11y';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ThyTooltipDirective } from '../tooltip.directive';
import { dispatchMouseEvent } from '../../core/testing';
import { containsElement } from '@angular/animations/browser/src/render/shared';

const initialTooltipMessage = 'hello, this is tooltip message';
const TOOLTIP_CLASS = `thy-tooltip`;

@Component({
    selector: 'thy-demo-tooltip-basic',
    template: `
        <button
            [thyTooltip]="message"
            [thyTooltipDisabled]="disabled"
            [thyTooltipShowDelay]="showDelay"
            [thyTooltipHideDelay]="hideDelay"
            [thyTooltipPlacement]="placement"
        >
            Basic Usage
        </button>
    `
})
class ThyDemoTooltipBasicComponent {
    @ViewChild(ThyTooltipDirective) tooltip: ThyTooltipDirective;

    message = initialTooltipMessage;

    disabled = false;

    showDelay = undefined;

    hideDelay = undefined;

    placement = 'top';
}

@NgModule({
    imports: [ThyTooltipModule],
    declarations: [ThyDemoTooltipBasicComponent],
    exports: []
})
export class TooltipTestModule {}

describe(`ThyTooltip`, () => {
    let overlayContainer: OverlayContainer;
    let overlayContainerElement: HTMLElement;

    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({
            imports: [TooltipTestModule, NoopAnimationsModule]
        });

        TestBed.compileComponents();

        inject([OverlayContainer, FocusMonitor], (oc: OverlayContainer, fm: FocusMonitor) => {
            overlayContainer = oc;
            overlayContainerElement = oc.getContainerElement();
            // focusMonitor = fm;
        })();
    }));

    afterEach(inject([OverlayContainer], (currentOverlayContainer: OverlayContainer) => {
        // Since we're resetting the testing module in some of the tests,
        // we can potentially have multiple overlay containers.
        currentOverlayContainer.ngOnDestroy();
        overlayContainer.ngOnDestroy();
    }));

    /** Asserts whether a tooltip directive has a tooltip instance. */
    function assertTooltipInstance(tooltip: ThyTooltipDirective, shouldExist: boolean): void {
        expect(!!tooltip['tooltipInstance']).toBe(shouldExist);
    }

    describe(`basic usage`, () => {
        let fixture: ComponentFixture<ThyDemoTooltipBasicComponent>;
        let basicTestComponent: ThyDemoTooltipBasicComponent;
        // let tooltipDebugElement: DebugElement;
        let tooltipDirective: ThyTooltipDirective;
        let buttonDebugElement: DebugElement;
        let buttonElement: HTMLElement;

        function getTooltipVisible() {
            return tooltipDirective['isTooltipVisible']();
        }

        beforeEach(() => {
            fixture = TestBed.createComponent(ThyDemoTooltipBasicComponent);
            fixture.detectChanges();
            basicTestComponent = fixture.debugElement.componentInstance;

            buttonDebugElement = fixture.debugElement.query(By.css('button'));
            buttonElement = buttonDebugElement.nativeElement;

            tooltipDirective = buttonDebugElement.injector.get<ThyTooltipDirective>(ThyTooltipDirective);
        });

        it('should show and hide the tooltip', fakeAsync(() => {
            assertTooltipInstance(tooltipDirective, false);
            // fake mouseenter event
            dispatchMouseEvent(buttonElement, 'mouseenter');

            expect(getTooltipVisible()).toBe(false);
            // Tick for the show delay (default is 200)
            tick(200);
            expect(getTooltipVisible()).toBe(true);
            expect(overlayContainerElement.textContent).toEqual('');

            fixture.detectChanges();

            // wait till animation has finished
            tick(100);

            // Make sure tooltip is shown to the user and animation has finished
            const tooltipElement = overlayContainerElement.querySelector(`.${TOOLTIP_CLASS}`) as HTMLElement;
            expect(tooltipElement instanceof HTMLElement).toBe(true);
            expect(tooltipElement.style.transform).toBe('scale(1)');

            expect(overlayContainerElement.textContent).toContain(initialTooltipMessage);

            const tooltipHideDelay = 100; // default hide delay is 100
            // fake mouseleave event
            dispatchMouseEvent(buttonElement, 'mouseleave');
            expect(getTooltipVisible()).toBe(true);

            tick(tooltipHideDelay);
            fixture.detectChanges();
            expect(getTooltipVisible()).toBe(false);
            assertTooltipInstance(tooltipDirective, true);

            // On animation complete, should expect that the tooltip has been detached.
            flushMicrotasks();
            assertTooltipInstance(tooltipDirective, false);
        }));

        it('should set css classes on the overlay panel element and tooltip element', fakeAsync(() => {
            // TODO::
        }));

        it('should show without show delay', fakeAsync(() => {
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.showDelay = 0;
            fixture.detectChanges();

            expect(getTooltipVisible()).toBe(false);
            // fake mouseenter event
            dispatchMouseEvent(buttonElement, 'mouseenter');
            tick(0);
            expect(getTooltipVisible()).toBe(true);
            fixture.detectChanges();
            expect(overlayContainerElement.textContent).toContain(initialTooltipMessage);
        }));

        // for test more fast, show tooltip directly call tooltip directive's show
        // method without delay replace mock mouseenter event as belows
        // because the above cases have been test mouseenter and delay

        it('should be able to override the show and hide delays', fakeAsync(() => {
            basicTestComponent.showDelay = 477;
            basicTestComponent.hideDelay = 688;

            fixture.detectChanges();
            tooltipDirective.show();
            tick();

            expect(getTooltipVisible()).toBe(false);
            tick(477);
            expect(getTooltipVisible()).toBe(true);

            tooltipDirective.hide();
            fixture.detectChanges();
            tick();

            expect(getTooltipVisible()).toBe(true);
            tick(688);
            expect(getTooltipVisible()).toBe(false);
        }));

        it('should be able to override the default placement', fakeAsync(() => {
            basicTestComponent.placement = 'left';
            fixture.detectChanges();

            expect(tooltipDirective.placement).toBe('left');
            tooltipDirective.show(0);
            tick(0);
            fixture.detectChanges();
            tick(200);

            expect(overlayContainerElement.textContent).toContain(initialTooltipMessage);
            const tooltipElement = overlayContainerElement.querySelector(`.${TOOLTIP_CLASS}`) as HTMLElement;
            expect(tooltipElement.classList.contains('thy-tooltip-left')).toBe(true);
        }));

        it('should not show tooltip when content is not present or empty', () => {
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.message = undefined;
            fixture.detectChanges();
            tooltipDirective.show(0);
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.message = null;
            fixture.detectChanges();
            tooltipDirective.show(0);
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.message = '';
            fixture.detectChanges();
            tooltipDirective.show(0);
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.message = '   ';
            fixture.detectChanges();
            tooltipDirective.show(0);
            assertTooltipInstance(tooltipDirective, false);

            basicTestComponent.message = 'new message';
            fixture.detectChanges();
            tooltipDirective.show(0);
            assertTooltipInstance(tooltipDirective, true);
        });

        it('should not show if disabled', fakeAsync(() => {
            // Test that disabling the tooltip will not set the tooltip visible
            basicTestComponent.disabled = true;
            fixture.detectChanges();
            tooltipDirective.show(0);
            tick(0);
            expect(getTooltipVisible()).toBe(false);

            // Test to make sure setting disabled to false will show the tooltip
            // Sanity check to make sure everything was correct before (detectChanges, tick)
            basicTestComponent.disabled = false;
            fixture.detectChanges();
            tooltipDirective.show(0);
            tick(0);
            expect(getTooltipVisible()).toBe(true);
        }));

        it('should hide if disabled while tooltip is visible', fakeAsync(() => {
            // Display the tooltip with a timeout before hiding.
            tooltipDirective.show(0);
            fixture.detectChanges();
            tick(0);
            expect(getTooltipVisible()).toBe(true);

            // Set tooltip to be disabled and verify that the tooltip hides.
            basicTestComponent.disabled = true;
            fixture.detectChanges();
            tick(0);
            expect(getTooltipVisible()).toBe(false);
        }));

        it('should not show if hide is called before delay finishes', async(() => {
            assertTooltipInstance(tooltipDirective, false);

            // const tooltipDelay = 1000;

            // tooltipDirective.show(tooltipDelay);
            // expect(tooltipDirective._isTooltipVisible()).toBe(false);

            // fixture.detectChanges();
            // expect(overlayContainerElement.textContent).toContain('');
            // tooltipDirective.hide();

            // fixture.whenStable().then(() => {
            //   expect(tooltipDirective._isTooltipVisible()).toBe(false);
            // });
        }));

        it('should be able to update the tooltip placement while open', fakeAsync(() => {
            // tooltipDirective.position = 'below';
            // tooltipDirective.show();
            // tick();
            // assertTooltipInstance(tooltipDirective, true);
            // tooltipDirective.position = 'above';
            // spyOn(tooltipDirective._overlayRef!, 'updatePosition').and.callThrough();
            // fixture.detectChanges();
            // tick();
            // assertTooltipInstance(tooltipDirective, true);
            // expect(tooltipDirective._overlayRef!.updatePosition).toHaveBeenCalled();
        }));

        it('should be able to modify the tooltip content', fakeAsync(() => {
            // assertTooltipInstance(tooltipDirective, false);
            // tooltipDirective.show();
            // tick(0); // Tick for the show delay (default is 0)
            // expect(tooltipDirective._tooltipInstance!._visibility).toBe('visible');
            // fixture.detectChanges();
            // expect(overlayContainerElement.textContent).toContain(initialTooltipMessage);
            // const newMessage = 'new tooltip message';
            // tooltipDirective.message = newMessage;
            // fixture.detectChanges();
            // expect(overlayContainerElement.textContent).toContain(newMessage);
        }));

        it('should allow extra classes to be set on the tooltip', fakeAsync(() => {
            // assertTooltipInstance(tooltipDirective, false);
            // tooltipDirective.show();
            // tick(0); // Tick for the show delay (default is 0)
            // fixture.detectChanges();
            // // Make sure classes aren't prematurely added
            // let tooltipElement = overlayContainerElement.querySelector('.mat-tooltip') as HTMLElement;
            // expect(tooltipElement.classList).not.toContain('custom-one',
            //   'Expected to not have the class before enabling matTooltipClass');
            // expect(tooltipElement.classList).not.toContain('custom-two',
            //   'Expected to not have the class before enabling matTooltipClass');
            // // Enable the classes via ngClass syntax
            // fixture.componentInstance.showTooltipClass = true;
            // fixture.detectChanges();
            // // Make sure classes are correctly added
            // tooltipElement = overlayContainerElement.querySelector('.mat-tooltip') as HTMLElement;
            // expect(tooltipElement.classList).toContain('custom-one',
            //   'Expected to have the class after enabling matTooltipClass');
            // expect(tooltipElement.classList).toContain('custom-two',
            //   'Expected to have the class after enabling matTooltipClass');
        }));
    });
});
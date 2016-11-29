import {
  Component,
  ElementRef,
  ViewEncapsulation,
  ChangeDetectorRef,
  EventEmitter,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import {DateTime} from './datetime';

//@TODO
// . display currently selected day

/**
 * show a selected date in monthly calendar
 */
@Component({
  providers    : [DateTime],
  selector     : 'datetime-picker',
  template     : `
<div class="datetime-picker" tabindex="0">

  <!-- Month - Year  -->
  <div class="month">
    <button type="button" class="prev" (click)="updateMonthData(-1)">&laquo;</button>
     <span title="{{dateTime.months[monthData.month]?.fullName}}">
           {{dateTime.months[monthData.month]?.shortName}}
     </span>
    {{monthData.year}}
    <button type="button" class="next" (click)="updateMonthData(+1)">&raquo;</button>
  </div>

  <div class="days">

    <!-- Su Mo Tu We Th Fr Sa -->
    <div class="day-of-week"
         *ngFor="let dayOfWeek of dateTime.localizedDaysOfWeek"
         [ngClass]="{weekend: dayOfWeek.weekend}"
         title="{{dayOfWeek.fullName}}">
      {{dayOfWeek.shortName}}
    </div>

    <!-- Fill up blank days for this month -->
    <div *ngIf="monthData.leadingDays.length < 7">
      <div class="day" *ngFor="let dayNum of monthData.leadingDays"
           [ngClass]="{weekend: [0,6].indexOf(toDate(monthData.year, monthData.month-1, dayNum).getDay()) !== -1}">
        {{dayNum}}
      </div>
    </div>

    <div class="day selectable"
         *ngFor="let dayNum of monthData.days"
         (click)="selectDate(dayNum)"
         title="{{monthData.year}}-{{monthData.month+1}}-{{dayNum}}"
         [ngClass]="{
           selected:
             toDate(monthData.year, monthData.month, dayNum).getTime() === toDateOnly(selectedDate).getTime(),
           today:
             toDate(monthData.year, monthData.month, dayNum).getTime() === today.getTime(),
           weekend:
             [0,6].indexOf(toDate(monthData.year, monthData.month, dayNum).getDay()) !== -1
         }">
      {{dayNum}}
    </div>

    <!-- Fill up blank days for this month -->
    <div *ngIf="monthData.trailingDays.length < 7">
      <div class="day"
           *ngFor="let dayNum of monthData.trailingDays"
           [ngClass]="{weekend: [0,6].indexOf(toDate(monthData.year, monthData.month+1, dayNum).getDay()) !== -1}">
        {{dayNum}}
      </div>
    </div>
  </div>

  <!-- Time -->
  <div class="days" id="time" *ngIf="!dateOnly">
    <label class="timeLabel">Time:</label>
    <span class="timeValue">
      {{("0"+hour).slice(-2)}} : {{("0"+minute).slice(-2)}}
    </span><br/>
    <label class="hourLabel">Hour:</label>
    <input #hours class="hourInput"
           (change)="selectDate()"
           type="range" min="0" max="23" [(ngModel)]="hour" />
    <label class="minutesLabel">Min:</label>
    <input #minutes class="minutesInput"
           (change)="selectDate()"
           type="range" min="0" max="59" range="10" [(ngModel)]="minute"/>
  </div>
</div>

<!--<hr/>-->
<!--Date: {{selectedDate}}<br/>-->
<!--Hour: {{hour}} Minute: {{minute}}<br/>-->
  `,
  styles       : [
    `
 @keyframes slideDown {
  0% {
    transform:  translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.ng2-datetime-picker {
    display: inline-block;
    position: relative;
}

.datetime-picker {
    color: #333;
    outline-width: 0;
    font: normal 14px sans-serif;
    border: 1px solid #ddd;
    display: inline-block;
    background: #fff;
    animation: slideDown 0.1s ease-in-out;
    animation-fill-mode: both;
}
.datetime-picker > .month {
    text-align: center;
    line-height: 22px;
    padding: 10px;
    background: #fcfcfc;
    text-transform: uppercase;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
    position: relative;
}
.datetime-picker > .month > button {
    color: #555;
    font: normal 14px sans-serif;
    outline: none;
    position: absolute;
    background: transparent;
    border: none;
    cursor: pointer;
}
.datetime-picker > .month > button:hover {
    color: #333;
}
.datetime-picker > .month > button.prev {
    left: 10px;
}
.datetime-picker > .month > button.next {
    right: 10px;
}
.datetime-picker > .days {
    width: 210px; /* 30 x 7 */
    margin: 10px;
    text-align: center;
}
.datetime-picker > .days .day-of-week,
.datetime-picker > .days .day {
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    border: 1px solid transparent;
    width: 30px;
    line-height: 28px;
    float: left;
}
.datetime-picker > .days .day-of-week {
    font-weight: bold;
}
.datetime-picker > .days .day-of-week.weekend {
    color: #ccc;
    background-color: inherit;
}
.datetime-picker > .days .day:not(.selectable) {
    color: #ccc;
    cursor: default;
}
.datetime-picker > .days .weekend {
    color: #ccc;
    background-color: #eee;
}
.datetime-picker > .days .day.selectable  {
    cursor: pointer;
}
.datetime-picker > .days .day.selected {
    background: gray;
    color: #fff;
}
.datetime-picker > .days .day:not(.selected).selectable:hover {
    background: #eee;
}
.datetime-picker > .days:after {
    content: '';
    display: block;
    clear: left;
    height: 0;
}
.datetime-picker .hourLabel,
.datetime-picker .minutesLabel {
    display: inline-block;
    width: 40px;
    text-align: right;
}
.datetime-picker input[type=range] {
    width: 200px;
}
  `
  ],
  encapsulation: ViewEncapsulation.None
})
export class DateTimePickerComponent implements AfterViewInit {
  /**
   * public variables
   */
  public dateOnly:boolean;

  public selectedDate:Date; //currently selected date
  public hour:number;
  public minute:number;

  public el:HTMLElement; // this component element
  public monthData:any;  // month calendar data

  public changes:EventEmitter<any> = new EventEmitter();
  public closing:EventEmitter<any> = new EventEmitter();

  @ViewChild('hours')
  private _hours:ElementRef;
  @ViewChild('minutes')
  private _minutes:ElementRef;

  public constructor (elementRef:ElementRef, public dateTime:DateTime, public cdRef:ChangeDetectorRef) {
    this.el = elementRef.nativeElement;
  }

  public ngAfterViewInit ():void {
    if (!this.dateOnly) {
      this._hours.nativeElement.addEventListener('keyup', (e:KeyboardEvent) => {
        e.stopPropagation();
      });
      this._hours.nativeElement.addEventListener('mousedown', (e:KeyboardEvent) => {
        e.stopPropagation();
      });
      this._minutes.nativeElement.addEventListener('keyup', (e:KeyboardEvent) => {
        e.stopPropagation();
      });
      this._minutes.nativeElement.addEventListener('mousedown', (e:KeyboardEvent) => {
        e.stopPropagation();
      });
    }
  }

  public get year ():number {
    return this.selectedDate.getFullYear();
  }

  public get month ():number {
    return this.selectedDate.getMonth();
  }

  public get day ():number {
    return this.selectedDate.getDate();
  }

  public get today ():Date {
    let dt = new Date();
    dt.setHours(0);
    dt.setMinutes(0);
    dt.setSeconds(0);
    dt.setMilliseconds(0);
    return dt;
  }

  public initDateTime (date:Date, defaultValue:Date) {
    defaultValue = defaultValue ||  new Date();
    date = date || defaultValue;
    this.selectedDate = date;
    this.hour         = this.selectedDate.getHours();
    this.minute       = this.selectedDate.getMinutes();
    this.monthData    = this.dateTime.getMonthData(this.year, this.month);
  }

  public toDate (year:number, month:number, day:number):Date {
    return new Date(year, month, day);
  }

  public toDateOnly (date:Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  /**
   * set the selected date and close it when closeOnSelect is true
   * @param date {Date}
   */
  public selectDate (dayNum?:number) {
    if (dayNum) {
      this.selectedDate = new Date(this.monthData.year, this.monthData.month, dayNum);
    }
    this.selectedDate.setHours(parseInt( ''+this.hour || '0', 10));
    this.selectedDate.setMinutes(parseInt( ''+this.minute|| '0', 10));
    this.changes.emit(this.selectedDate);
    this.closing.emit(true);
  };

  /**
   * show prev/next month calendar
   */
  public updateMonthData (num:number) {
    this.monthData = this.dateTime.getMonthData(this.monthData.year, this.monthData.month + num);
  }

}
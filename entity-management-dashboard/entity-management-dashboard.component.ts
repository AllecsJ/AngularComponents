import { Component, OnInit } from '@angular/core';
import { ParamService } from '../../service/param.service';
import { NavigationService } from '../../service/navigation.service';
import { NavigationComponentType } from '../../service/tree.service';

@Component({
  selector: 'app-entity-management-dashboard',
  templateUrl: './entity-management-dashboard.component.html',
  styleUrls: ['./entity-management-dashboard.component.css']
})
export class EntityManagementDashboardComponent implements OnInit {

  incomingData: any;
  sub: string;
  itemArray: Array<NavigationComponentType> = [];
  entityId: string;
  appState: string;
  entityStatus: string;
  approved: number;


  constructor(
    private urlData: ParamService,
    private nav: NavigationService,

  ) {}
  ngOnInit() {

    this.urlData.itemArrayVal.subscribe(
      (itemArray) => (this.itemArray = itemArray)
    );
    //param data passed by the previous component
    this.urlData.urlData.subscribe((sub) => (this.incomingData = sub));
    //set the user id as sub
    this.sub = this.incomingData.split(",")[0];
    this.entityId = this.incomingData.split(",")[0];
    this.appState = this.incomingData.split(",")[2];  
    //set the entity status - if approved or not approved
    this.entityStatus = this.incomingData.split(",")[1];
    this.approved = Number(this.entityStatus);
  }

  public static defineNavigation() {
    return {
      id: 'entity-management-dashboard',
      component: EntityManagementDashboardComponent,
      tabTitle: 'Entity Chief Details',
      windowTitle: 'Single Window',
      singleton: true,
      accessors: ['Admin.user'],
      params: null
    };
  } 


  



}

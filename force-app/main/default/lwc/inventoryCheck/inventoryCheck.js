import { LightningElement, wire  } from 'lwc';

import getWarehouses from '@salesforce/apex/lwcHelper.getWarehouse';
import userWareHouse from '@salesforce/apex/lwcHelper.userLocation';
import searchInventory from '@salesforce/apex/quickPriceSearch.searchInventory';
import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues'
import userId from '@salesforce/user/Id';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class InventoryCheck extends LightningElement {
    userwareHouseNumb;
    userId = userId; 
    selWareHouse; 
    formSize;
    prodData; 
    loaded = true; 
    recordTypeId
    subCat = 'All';
    primCat = 'All'; 
    primaryValues
    subValues
    showCats = false; 

    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR);
        this.init(); 
    }
    screenSize = (screen) => {
        return screen === 'Large'? true : false  
    }
    async init(){
        let back = await getWarehouses()
        this.userwareHouseNumb = await userWareHouse({userId: this.userId});
        this.primaryValues = await getPickListValues({objName: 'Product2', fieldAPI: 'Primary_Category__c'});
        this.subValues = await getPickListValues({objName: 'Product2', fieldAPI:'Subcategory__c'})
        this.primCat = this.primaryValues[0].value;  
        let mapped = await back.map((item, index) =>({
                                    ...item, 
                                    label:item.Name, 
                                    value:item.Id
                    
                                }))
        mapped.unshift({label:'All', value:'All'})
        this.warehouseOptions = [...mapped]; 
        let start = this.warehouseOptions.filter((x)=> x.label.includes(this.userwareHouseNumb))
        this.selWareHouse = start[0].value; 
        this.loaded = true; 
    }

    handleKeys(evt){
        let enterKey = evt.keyCode === 13;
        if(enterKey){
            this.searchTerm = evt.target.value;
            this.handleSearch();
        }
    }

    changeWarehouse(locId){
        this.selWareHouse = locId.detail.value;
    }

   async handleSearch(){
    this.loaded = false;     
        this.searchTerm = this.template.querySelector('[data-value="searchInput"]').value
            if(this.searchTerm.length<3 || this.selWareHouse ===undefined){
                //add lwc alert here
                return;
        }
        this.prodData = await searchInventory({term: this.searchTerm, locId: this.selWareHouse});
        this.loaded = true; 
    }

    setPrime(x){
        this.primCat = x.detail.value
    }
    setSub(x){
        this.subCat = x.detail.value; 
    }
    handleShowCats(){
        this.showCats = this.showCats ? false : true; 
    }
}
import { LightningElement, wire  } from 'lwc';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import getWarehouses from '@salesforce/apex/quickPriceSearch.getWarehouse';
import userWareHouse from '@salesforce/apex/quickPriceSearch.userLocation';
import searchInventory from '@salesforce/apex/quickPriceSearch.searchInventory'
import userId from '@salesforce/user/Id';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class InventoryCheck extends LightningElement {
    userwareHouseNumb;
    userId = userId; 
    selWareHouse; 
    formSize;
    prodData; 
    loaded = false; 
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
}
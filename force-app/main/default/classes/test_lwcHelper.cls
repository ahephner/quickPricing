@isTest
private class test_lwcHelper {
    @isTest static void getPicklists(){
      
        System.Test.startTest();
         list<lwcHelper.pickListBack> wrapper = lwcHelper.getPickListValues('Product2', 'Primary_Category__c');
         Map<String, List<Map<String,String>>> multi = lwcHelper.multiplePicklists2('Product2', 'Primary_Category__c,Subcategory__c'); 
        system.Test.stopTest();
    }
    @isTest
    static void Test_getWarehouse(){
        Schema.Location warehouse = new Schema.Location();
        warehouse.Name= 'ATS Warehouse';
        warehouse.Location_Number__c ='2';
        warehouse.IsInventoryLocation = true; 
        warehouse.LocationType = 'ATS'; 
        
        insert warehouse; 
        
        Test.startTest();
        	list<Schema.Location> stores = lwcHelper.getWareHouse(); 
        Test.stopTest();
        system.assertEquals(1, stores.size());  
    }
    @isTest(seeAllData=True)
    static void Test_getUserLocation(){
        string userId = [select id from user where lastname = 'Pruden'].Id;
        
        Test.startTest();
        	string loc = lwcHelper.userLocation(userId);
        Test.startTest(); 
    }
}